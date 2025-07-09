export default class AudioManager {
  constructor() {
    this.audioContext = null;
    this.masterVolume = 0.3;
    this.enabled = true;
    this.initializeAudio();
  }

  initializeAudio() {
    try {
      // Crear contexto de audio
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioContext();
      
      // Crear nodo de ganancia maestro
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.setValueAtTime(this.masterVolume, this.audioContext.currentTime);
      this.masterGain.connect(this.audioContext.destination);
      
      console.log('Sistema de audio inicializado correctamente');
    } catch (error) {
      console.warn('No se pudo inicializar el sistema de audio:', error);
      this.enabled = false;
    }
  }

  // Método para reanudar el contexto de audio (requerido por algunos navegadores)
  resumeAudio() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  // Genera un tono básico
  createOscillator(frequency, type = 'sine') {
    if (!this.enabled || !this.audioContext) return null;
    
    const oscillator = this.audioContext.createOscillator();
    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
    oscillator.type = type;
    return oscillator;
  }

  // Crea un envelope ADSR básico
  createEnvelope(gainNode, attack = 0.01, decay = 0.1, sustain = 0.7, release = 0.3) {
    const now = this.audioContext.currentTime;
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(1, now + attack);
    gainNode.gain.linearRampToValueAtTime(sustain, now + attack + decay);
    return now + attack + decay;
  }

  // Sonido de dados rodando
  playDiceRoll() {
    if (!this.enabled) return;
    
    this.resumeAudio();
    
    const duration = 0.8;
    const now = this.audioContext.currentTime;
    
    // Ruido blanco para simular dados rodando
    const bufferSize = this.audioContext.sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    
    // Generar ruido blanco con modulación
    for (let i = 0; i < bufferSize; i++) {
      const decay = 1 - (i / bufferSize);
      data[i] = (Math.random() * 2 - 1) * decay * 0.3;
    }
    
    const noise = this.audioContext.createBufferSource();
    noise.buffer = buffer;
    
    // Filtro para dar carácter al sonido
    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.exponentialRampToValueAtTime(200, now + duration);
    
    const gain = this.audioContext.createGain();
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration);
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    
    noise.start(now);
    noise.stop(now + duration);
  }

  // Sonido de dados cayendo/resultado
  playDiceResult(isDouble = false) {
    if (!this.enabled) return;
    
    this.resumeAudio();
    
    const now = this.audioContext.currentTime;
    
    // Sonido base (dados cayendo)
    const baseFreq = isDouble ? 600 : 400;
    const osc1 = this.createOscillator(baseFreq, 'triangle');
    const osc2 = this.createOscillator(baseFreq * 1.5, 'sine');
    
    const gain1 = this.audioContext.createGain();
    const gain2 = this.audioContext.createGain();
    
    this.createEnvelope(gain1, 0.01, 0.05, 0.8, 0.2);
    this.createEnvelope(gain2, 0.02, 0.08, 0.6, 0.3);
    
    osc1.connect(gain1);
    osc2.connect(gain2);
    gain1.connect(this.masterGain);
    gain2.connect(this.masterGain);
    
    // Si es doble, agregar un tono extra celebratorio
    if (isDouble) {
      const celebOsc = this.createOscillator(800, 'sine');
      const celebGain = this.audioContext.createGain();
      
      celebGain.gain.setValueAtTime(0, now + 0.1);
      celebGain.gain.linearRampToValueAtTime(0.3, now + 0.15);
      celebGain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
      
      celebOsc.connect(celebGain);
      celebGain.connect(this.masterGain);
      
      celebOsc.start(now + 0.1);
      celebOsc.stop(now + 0.4);
    }
    
    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.3);
    osc2.stop(now + 0.3);
  }

  // Sonido de movimiento de ficha
  playPieceMove() {
    if (!this.enabled) return;
    
    this.resumeAudio();
    
    const now = this.audioContext.currentTime;
    const osc = this.createOscillator(300, 'triangle');
    const gain = this.audioContext.createGain();
    
    // Sonido corto y sutil
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start(now);
    osc.stop(now + 0.1);
  }

  // Sonido de captura
  playCapture() {
    if (!this.enabled) return;
    
    this.resumeAudio();
    
    const now = this.audioContext.currentTime;
    
    // Sonido descendente para representar la captura
    const osc1 = this.createOscillator(600, 'sawtooth');
    const osc2 = this.createOscillator(400, 'triangle');
    
    const gain1 = this.audioContext.createGain();
    const gain2 = this.audioContext.createGain();
    
    // Frecuencia descendente
    osc1.frequency.exponentialRampToValueAtTime(200, now + 0.3);
    osc2.frequency.exponentialRampToValueAtTime(150, now + 0.3);
    
    gain1.gain.setValueAtTime(0.3, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    
    gain2.gain.setValueAtTime(0.2, now + 0.05);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
    
    osc1.connect(gain1);
    osc2.connect(gain2);
    gain1.connect(this.masterGain);
    gain2.connect(this.masterGain);
    
    osc1.start(now);
    osc2.start(now + 0.05);
    osc1.stop(now + 0.3);
    osc2.stop(now + 0.35);
  }

  // Sonido de llegada a meta
  playGoalReached() {
    if (!this.enabled) return;
    
    this.resumeAudio();
    
    const now = this.audioContext.currentTime;
    
    // Arpeggio ascendente celebratorio
    const frequencies = [440, 554, 659, 880]; // A, C#, E, A (acorde mayor)
    
    frequencies.forEach((freq, index) => {
      const osc = this.createOscillator(freq, 'triangle');
      const gain = this.audioContext.createGain();
      
      const startTime = now + (index * 0.1);
      gain.gain.setValueAtTime(0.4, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.5);
      
      osc.connect(gain);
      gain.connect(this.masterGain);
      
      osc.start(startTime);
      osc.stop(startTime + 0.5);
    });
  }

  // Sonido de victoria
  playVictory() {
    if (!this.enabled) return;
    
    this.resumeAudio();
    
    const now = this.audioContext.currentTime;
    
    // Fanfare de victoria
    const melody = [440, 554, 659, 880, 659, 880, 1109]; // A, C#, E, A, E, A, C#
    
    melody.forEach((freq, index) => {
      const osc = this.createOscillator(freq, 'triangle');
      const gain = this.audioContext.createGain();
      
      const startTime = now + (index * 0.15);
      const duration = index === melody.length - 1 ? 0.8 : 0.2;
      
      gain.gain.setValueAtTime(0.5, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
      
      osc.connect(gain);
      gain.connect(this.masterGain);
      
      osc.start(startTime);
      osc.stop(startTime + duration);
    });
  }

  // Sonido de error/acción no válida
  playError() {
    if (!this.enabled) return;
    
    this.resumeAudio();
    
    const now = this.audioContext.currentTime;
    const osc = this.createOscillator(200, 'sawtooth');
    const gain = this.audioContext.createGain();
    
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start(now);
    osc.stop(now + 0.2);
  }

  // Sonido de clic en botón
  playButtonClick() {
    if (!this.enabled) return;
    
    this.resumeAudio();
    
    const now = this.audioContext.currentTime;
    const osc = this.createOscillator(800, 'square');
    const gain = this.audioContext.createGain();
    
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start(now);
    osc.stop(now + 0.05);
  }

  // Control de volumen
  setVolume(volume) {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    if (this.masterGain) {
      this.masterGain.gain.setValueAtTime(this.masterVolume, this.audioContext.currentTime);
    }
  }

  // Silenciar/desmutear
  toggleMute() {
    this.enabled = !this.enabled;
    return this.enabled;
  }
} 