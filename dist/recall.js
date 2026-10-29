(() => {
  'use strict';
  // Allow punctuation, whitespace and paragraph numbering, but never omit words.
  function normalize(value) {
    return String(value ?? '').normalize('NFKC').toLowerCase()
      .replace(/^\s*答\s*[:：]\s*/u, '')
      .replace(/(^|[\n；;])\s*(?:[（(]?[一二三四五六七八九十\d]+[）).、．]|[•·*\-])\s*/g, '$1')
      .replace(/[\p{P}\p{Z}\s]/gu, '');
  }
  function grade(question, value) {
    const text = normalize(typeof value === 'string' ? value : '');
    const parts = question.segments.map(segment => text.includes(normalize(segment)));
    let correct = [question.answer, ...(question.alternatives || [])].some(answer => normalize(answer) === text);
    if (!correct && question.mode === 'list' && parts.every(Boolean)) {
      let remaining = text;
      for (const part of question.segments.map(normalize).sort((a,b) => b.length-a.length)) {
        const index = remaining.indexOf(part);
        if (index < 0) return { correct: false, parts };
        remaining = remaining.slice(0,index) + remaining.slice(index+part.length);
      }
      correct = remaining.length === 0;
    }
    if (correct) parts.fill(true);
    return { correct, parts };
  }
  window.RECALL = { normalize, grade };
})();
