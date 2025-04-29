const noteDiv = document.getElementById('note');
const audioCtx = new AudioContext();

navigator.mediaDevices.getUserMedia({ audio: true })
  .then(stream => {
    const micStream = audioCtx.createMediaStreamSource(stream);

    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 200;

    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 2048;
    const data = new Uint8Array(analyser.frequencyBinCount);

    micStream.connect(filter);
    filter.connect(analyser);

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
      analyser.getByteFrequencyData(data);

      let maxIndex = 0;
      for (let i = 1; i < data.length; i++) {
        if (data[i] > data[maxIndex]) {
          maxIndex = i;
        }
      }

      const freq = maxIndex * audioCtx.sampleRate / analyser.fftSize;
      if (freq > 20 && freq < 300) {
        const note = frequencyToNote(freq);
        noteDiv.innerText = note;
      }

      requestAnimationFrame(detectNote);
    }

    detectNote();
  })
  .catch(err => console.error('Mic access error:', err));
