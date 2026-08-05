// ============================================================
//  esc-pos/constants.js — Printers, baud rates e estado inicial
// ============================================================

export const PRINTERS = {
    epson:   { name: 'Epson',   notes: 'Comandos ESC/POS padrão. Modelo-base: TM-T20.' },
    bematech:{ name: 'Bematech',notes: 'Comandos ESC/POS (compatível). Modelo-base: MP-4200.' },
    elgin:   { name: 'Elgin',   notes: 'Comandos ESC/POS (compatível). Modelo-base: i9.' },
    daruma:  { name: 'Daruma',  notes: 'Comandos ESC/POS (compatível). Modelo-base: DR800.' },
};

export const BAUD_RATES = [9600, 19200, 38400, 57600, 115200];

export const DEFAULT_STATE = {
    printer: 'epson',
    baud: 9600,
    text: '',
    cut: true,
    drawer: true,
    feed: 3,
    align: 'center',
    font: 'a',
    bold: false,
    underline: false,
};
