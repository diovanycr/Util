const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

const GEMINI_API_KEY = defineSecret("GEMINI_API_KEY");
const OPENAI_API_KEY = defineSecret("OPENAI_API_KEY");

const RATE = { windowMs: 60_000, max: 20 };
const buckets = new Map();
function rateLimit(uid) {
    const now = Date.now();
    const entry = buckets.get(uid) || { count: 0, resetAt: now + RATE.windowMs };
    if (now > entry.resetAt) { entry.count = 0; entry.resetAt = now + RATE.windowMs; }
    entry.count++;
    buckets.set(uid, entry);
    return entry.count <= RATE.max;
}

exports.aiProxy = onCall({ secrets: [GEMINI_API_KEY, OPENAI_API_KEY] }, async (req) => {
    if (!req.auth) throw new HttpsError("unauthenticated", "Requer autenticacao.");
    const { provider, query } = req.data || {};
    if (!provider || !query || typeof query !== "string") {
        throw new HttpsError("invalid-argument", "provider e query sao obrigatorios.");
    }
    if (!["gemini", "openai"].includes(provider)) {
        throw new HttpsError("invalid-argument", "provider invalido.");
    }
    if (query.length > 2000) {
        throw new HttpsError("invalid-argument", "query excede 2000 caracteres.");
    }
    if (!rateLimit(req.auth.uid)) {
        throw new HttpsError("resource-exhausted", "Limite de requisicoes excedido.");
    }

    const start = Date.now();
    try {
        const result = provider === "gemini"
            ? await callGemini(query)
            : await callOpenAI(query);
        console.log(`[aiProxy] provider=${provider} uid=${req.auth.uid} latencyMs=${Date.now() - start}`);
        return result;
    } catch (err) {
        console.error(`[aiProxy] error provider=${provider}`, err.message);
        throw new HttpsError("internal", err.message);
    }
});

async function callGemini(query) {
    const key = GEMINI_API_KEY.value();
    if (!key) throw new Error("GEMINI_API_KEY nao configurada no servidor.");
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${key}`;
    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            contents: [{ parts: [{ text: query }] }],
            tools: [{ google_search: {} }],
            generationConfig: { maxOutputTokens: 2000, temperature: 0.3 }
        })
    });
    if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e?.error?.message || `Gemini: erro ${res.status}`);
    }
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const chunks = data.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const results = chunks.filter(c => c.web?.uri?.includes("futurasistemas.com.br"))
        .map(c => ({ title: c.web.title || "Artigo", link: c.web.uri, description: "" }));
    return { results, explanation: text };
}

async function callOpenAI(query) {
    const key = OPENAI_API_KEY.value();
    if (!key) throw new Error("OPENAI_API_KEY nao configurada no servidor.");
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify({ model: "gpt-4o-mini", messages: [{ role: "user", content: query }] })
    });
    if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e?.error?.message || `OpenAI: erro ${res.status}`);
    }
    const data = await res.json();
    return { results: [], explanation: data.choices?.[0]?.message?.content || "" };
}

exports.scheduledResetDailyCopyCounts = onSchedule(
    {
        schedule: "0 0 * * *",
        timeZone: "America/Sao_Paulo",
        retryCount: 3
    },
    async (event) => {
        const today = new Date().toISOString().split("T")[0];
        const usersSnap = await db.collection("users").get();
        let totalReset = 0;

        for (const userDoc of usersSnap.docs) {
            const uid = userDoc.id;
            const msgsRef = db.collection("users", uid, "messages");
            const snap = await msgsRef.where("copyCount", ">", 0).get();
            if (snap.empty) continue;

            const auditEntries = [];
            const batch = db.batch();

            snap.forEach((doc) => {
                const data = doc.data();
                if (data.deleted) return;
                const count = data.copyCount || 0;
                if (count <= 0) return;
                auditEntries.push({
                    messageId: doc.id,
                    title: data.title || "",
                    text: (data.text || "").slice(0, 200),
                    category: data.category || "Geral",
                    copyCount: count
                });
                batch.update(doc.ref, { copyCount: 0 });
            });

            if (auditEntries.length === 0) continue;

            const auditRef = db.collection("users", uid, "auditReset").doc();
            batch.set(auditRef, {
                resetAt: Date.now(),
                date: today,
                source: "cloud-function",
                totalCopies: auditEntries.reduce((s, e) => s + e.copyCount, 0),
                messages: auditEntries
            });

            await batch.commit();
            totalReset += auditEntries.length;
        }

        console.log(`[resetDailyCopyCounts] ${totalReset} mensagens zeradas em ${usersSnap.size} usuarios.`);
        return { resetCount: totalReset, users: usersSnap.size };
    }
);

exports.deleteUserAccount = onCall(async (req) => {
    if (!req.auth) throw new HttpsError("unauthenticated", "Requer autenticacao.");
    const uid = req.auth.uid;

    const userDoc = db.collection("users").doc(uid);
    const subcolls = ["messages", "problems", "links", "history", "auditReset", "preferences"];
    for (const name of subcolls) {
        const snap = await db.collection("users", uid, name).get();
        const batch = db.batch();
        snap.forEach((doc) => batch.delete(doc.ref));
        if (!snap.empty) await batch.commit();
    }
    await userDoc.delete();
    await admin.auth().deleteUser(uid);
    return { ok: true };
});

exports.adminDeleteUser = onCall(async (req) => {
    if (!req.auth) throw new HttpsError("unauthenticated", "Requer autenticacao.");
    const callerUid = req.auth.uid;

    const callerDoc = await db.collection("users").doc(callerUid).get();
    if (!callerDoc.exists || callerDoc.data()?.role !== "admin") {
        throw new HttpsError("permission-denied", "Apenas administradores podem excluir usuarios.");
    }

    const { targetUid } = req.data || {};
    if (!targetUid || typeof targetUid !== "string") {
        throw new HttpsError("invalid-argument", "targetUid e obrigatorio.");
    }

    const targetDoc = db.collection("users").doc(targetUid);
    const subcolls = ["messages", "problems", "links", "history", "auditReset", "preferences"];
    for (const name of subcolls) {
        const snap = await db.collection("users", targetUid, name).get();
        const batch = db.batch();
        snap.forEach((doc) => batch.delete(doc.ref));
        if (!snap.empty) await batch.commit();
    }
    await targetDoc.delete();

    try {
        await admin.auth().deleteUser(targetUid);
    } catch (authErr) {
        console.warn(`[adminDeleteUser] Usuario Auth ${targetUid} nao encontrado ou falha no Auth:`, authErr.message);
    }

    return { ok: true };
});
