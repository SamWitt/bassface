const noteDiv = document.getElementById('note');
const audioCtx = new AudioContext();

navigator.mediaDevices.getUserMedia({ audio: true })
  .then(stream => {
    const micStream = audioCtx.createMediaStreamSource(stream);

    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1000;

    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 2048;

    const buffer = new Float32Array(analyser.fftSize);

    micStream.connect(filter);
    filter.connect(analyser);

    function autoCorrelate(buf, sampleRate) {
      let SIZE = buf.length;
      let rms = 0;

      for (let i = 0; i < SIZE; i++) {
        let val = buf[i];
        rms += val * val;
      }
      rms = Math.sqrt(rms / SIZE);
      if (rms < 0.01) return -1; // Too quiet

      let r1 = 0, r2 = SIZE - 1, threshold = 0.2;
      for (let i = 0; i < SIZE / 2; i++) {
        if (Math.abs(buf[i]) < threshold) { r1 = i; break; }
      }
      for (let i = 1; i < SIZE / 2; i++) {
        if (Math.abs(buf[SIZE - i]) < threshold) { r2 = SIZE - i; break; }
      }

      buf = buf.slice(r1, r2);
      SIZE = buf.length;

      let c = new Array(SIZE).fill(0);
      for (let i = 0; i < SIZE; i++) {
        for (let j = 0; j < SIZE - i; j++) {
          c[i] = c[i] + buf[j] * buf[j + i];
        }
      }

      let d = 0;
      while (c[d] > c[d + 1]) d++;
      let maxval = -1, maxpos = -1;
      for (let i = d; i < SIZE; i++) {
        if (c[i] > maxval) {
          maxval = c[i];
          maxpos = i;
        }
      }
      let T0 = maxpos;

      return sampleRate / T0;
    }

    function frequencyToNote(freq) {
      const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
      const A4 = 440;
      const semitone = 12 * Math.log2(freq / A4);
      const noteNumber = Math.round(semitone) + 69;
      const noteName = noteNames[noteNumber % 12];
      const octave = Math.floor(noteNumber / 12) - 1;
      return `${noteName}${octave}`;
    }

    function detectNote() {
      analyser.getFloatTimeDomainData(buffer);
      const freq = autoCorrelate(buffer, audioCtx.sampleRate);

      if (freq !== -1 && freq < 2000) {
        const note = frequencyToNote(freq);
        noteDiv.innerText = note;
      } else {
        noteDiv.innerText = '—';
      }

      requestAnimationFrame(detectNote);
    }

    detectNote();
  })
  .catch(err => console.error('Mic access error:', err));
