/**
 * futura-widget-audio.js — Busca por voz e leitor de respostas (TTS)
 */

let isReading = false;
let currentUtterance = null;

export function initVoiceSearch(ctx) {
  const { voiceSearchBtn, searchInput } = ctx.dom;
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    if (voiceSearchBtn) {
      voiceSearchBtn.style.opacity = "0.5";
      voiceSearchBtn.style.cursor = "not-allowed";
      voiceSearchBtn.title = "Busca por voz indisponível neste navegador";
      voiceSearchBtn.addEventListener("click", () => {
        ctx.utils.showToast("A busca por voz requer um navegador compatível (como Google Chrome ou Microsoft Edge) e uma conexão segura (HTTPS).", "error");
      });
    }
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = "pt-BR";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  let isListening = false;

  voiceSearchBtn.addEventListener("click", () => {
    if (isListening) {
      recognition.stop();
    } else {
      recognition.start();
    }
  });

  recognition.onstart = () => {
    isListening = true;
    voiceSearchBtn.classList.add("listening");
    voiceSearchBtn.title = "Ouvindo... Clique para parar";
    searchInput.placeholder = "Ouvindo sua dúvida...";
    searchInput.value = "";
    ctx.utils.showToast("Reconhecimento de voz ativado. Fale sua dúvida.", "info");
  };

  recognition.onend = () => {
    isListening = false;
    voiceSearchBtn.classList.remove("listening");
    voiceSearchBtn.title = "Pesquisar por voz";
    searchInput.placeholder = "Como faço uma remessa de mercadoria?";
  };

  recognition.onresult = (event) => {
    const speechResult = event.results[0][0].transcript;
    searchInput.value = speechResult;
    ctx.utils.showToast(`Pesquisando por: "${speechResult}"`, "success");
    ctx.search.performSearch(ctx, speechResult);
  };

  recognition.onerror = (event) => {
    console.error("Speech recognition error", event.error);
    if (event.error !== "no-speech") {
      ctx.utils.showToast("Não consegui te ouvir claramente.", "error");
    }
  };
}

export function initAudioReader(ctx) {
  const { audioReadBtn } = ctx.dom;
  if (!audioReadBtn) return;
  audioReadBtn.addEventListener("click", () => toggleAudioReading(ctx));
}

export function toggleAudioReading(ctx) {
  const { summaryContent, audioReadBtn } = ctx.dom;
  if (!window.speechSynthesis) {
    ctx.utils.showToast("Leitura por voz não suportada neste navegador.", "error");
    return;
  }

  if (isReading) {
    stopAudioReading(ctx);
    return;
  }

  const textToRead = summaryContent ? summaryContent.innerText.trim() : "";
  if (!textToRead) {
    ctx.utils.showToast("Não há resposta para ler.", "info");
    return;
  }

  const chunks = textToRead.match(/[^.!?]+[.!?]+/g) || [textToRead];
  let currentChunkIndex = 0;
  isReading = true;

  function speakNextChunk() {
    if (currentChunkIndex >= chunks.length || !isReading) {
      resetAudioReaderState(ctx);
      return;
    }

    currentUtterance = new SpeechSynthesisUtterance(chunks[currentChunkIndex].trim());
    currentUtterance.lang = "pt-BR";

    const voices = window.speechSynthesis.getVoices();
    const ptVoice = voices.find(v => v.lang.includes("PT") || v.lang.includes("pt-BR") || v.lang.includes("pt_BR"));
    if (ptVoice) {
      currentUtterance.voice = ptVoice;
    }

    currentUtterance.onstart = () => {
      if (currentChunkIndex === 0) {
        audioReadBtn.classList.add("playing");
        audioReadBtn.innerHTML = '<i class="fa-solid fa-circle-stop"></i> <span>Parar</span>';
        ctx.utils.showToast("Lendo resposta do manual...", "info");
      }
    };

    currentUtterance.onend = () => {
      currentChunkIndex++;
      speakNextChunk();
    };

    currentUtterance.onerror = (e) => {
      console.error("Synthesis error", e);
      resetAudioReaderState(ctx);
    };

    window.speechSynthesis.speak(currentUtterance);
  }

  speakNextChunk();
}

export function stopAudioReading(ctx) {
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
  resetAudioReaderState(ctx);
}

function resetAudioReaderState(ctx) {
  const { audioReadBtn } = ctx.dom;
  isReading = false;
  currentUtterance = null;
  if (audioReadBtn) {
    audioReadBtn.classList.remove("playing");
    audioReadBtn.innerHTML = '<i class="fa-solid fa-volume-high"></i> <span>Ouvir</span>';
  }
}
