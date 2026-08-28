import { LEVEL_ONE } from './src/taxonomy.js';

const learnView = document.querySelector('#learn-view');
let current = null;
let answered = false;

const shuffle = items => [...items].sort(() => Math.random() - 0.5);

function chooseQuestion() {
  current = LEVEL_ONE[Math.floor(Math.random() * LEVEL_ONE.length)];
  answered = false;
}

function definitionFor(type) {
  return type.summary;
}

function renderQuiz() {
  if (!learnView) return;
  if (!current) chooseQuestion();

  const existing = learnView.querySelector('#definition-quiz');
  if (existing) return;

  const choices = shuffle([
    current,
    ...shuffle(LEVEL_ONE.filter(type => type.id !== current.id)).slice(0, 3),
  ]);

  const section = document.createElement('section');
  section.id = 'definition-quiz';
  section.className = 'definition-quiz panel';
  section.innerHTML = `
    <p class="eyebrow">Quiz · Definitions</p>
    <h2>What does ${current.name} mean?</h2>
    <p>Choose the definition that best matches this cloud genus.</p>
    <div class="definition-choices">
      ${choices.map(type => `
        <button type="button" data-definition-choice="${type.id}">${definitionFor(type)}</button>
      `).join('')}
    </div>
    <div id="definition-feedback" aria-live="polite"></div>
  `;

  learnView.append(section);
  section.querySelectorAll('[data-definition-choice]').forEach(button => {
    button.addEventListener('click', () => answer(button.dataset.definitionChoice));
  });
}

function answer(id) {
  if (answered) return;
  answered = true;
  const correct = id === current.id;
  const feedback = learnView.querySelector('#definition-feedback');
  if (!feedback) return;

  feedback.innerHTML = `
    <div class="feedback">
      <strong>${correct ? 'Correct!' : 'Not quite.'}</strong>
      <b>${current.name}</b>: ${definitionFor(current)}
      <div class="toolbar"><button id="definition-next" class="primary" type="button">Next definition</button></div>
    </div>
  `;

  learnView.querySelectorAll('[data-definition-choice]').forEach(button => {
    button.disabled = true;
    if (button.dataset.definitionChoice === current.id) button.classList.add('correct-choice');
    else if (button.dataset.definitionChoice === id) button.classList.add('wrong-choice');
  });

  learnView.querySelector('#definition-next')?.addEventListener('click', () => {
    learnView.querySelector('#definition-quiz')?.remove();
    chooseQuestion();
    renderQuiz();
  });
}

const observer = new MutationObserver(() => {
  if (learnView.classList.contains('active')) renderQuiz();
});

if (learnView) {
  observer.observe(learnView, { childList: true });
  renderQuiz();
}
