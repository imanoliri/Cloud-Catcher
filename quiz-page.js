import { LEVEL_ONE } from './src/taxonomy.js';

const quizView = document.querySelector('#quiz-view');
let imageCurrent = null;
let imageExampleIndex = 0;
let imageAnswered = false;

const shuffle = items => [...items].sort(() => Math.random() - 0.5);
const examplesFor = type => type.referenceImages?.length ? type.referenceImages : [{ image: type.referenceImage, page: type.referencePage }];
const thumbnailUrl = (src, width = 220) => src.replace(/([?&])width=\d+/i, `$1width=${width}`);

function chooseImageQuestion() {
  imageCurrent = LEVEL_ONE[Math.floor(Math.random() * LEVEL_ONE.length)];
  const examples = examplesFor(imageCurrent);
  imageExampleIndex = Math.floor(Math.random() * examples.length);
  imageAnswered = false;
}

function renderImageQuiz() {
  if (!quizView) return;
  if (!imageCurrent) chooseImageQuestion();

  const old = quizView.querySelector('#image-quiz');
  if (old) old.remove();

  const examples = examplesFor(imageCurrent);
  const example = examples[imageExampleIndex];
  const choices = shuffle([
    imageCurrent,
    ...shuffle(LEVEL_ONE.filter(type => type.id !== imageCurrent.id)).slice(0, 3),
  ]);

  const section = document.createElement('section');
  section.id = 'image-quiz';
  section.className = 'image-quiz panel';
  section.innerHTML = `
    <div class="image-quiz-copy">
      <p class="eyebrow">Quiz · Identification</p>
      <h2>Which cloud is this?</h2>
      <p>Choose the cloud genus that best matches the picture.</p>
      <div class="choices">
        ${choices.map(type => `<button type="button" data-image-choice="${type.id}">${type.name}</button>`).join('')}
      </div>
      <div id="image-feedback" aria-live="polite"></div>
    </div>
    <div class="learn-photo-wrap">
      <img class="learn-photo" src="${thumbnailUrl(example.image)}" alt="Cloud identification quiz example ${imageExampleIndex + 1} of ${examples.length}" decoding="async" fetchpriority="high">
      <span class="reference-badge">Example ${imageExampleIndex + 1} of ${examples.length}</span>
    </div>
  `;

  quizView.prepend(section);
  section.querySelectorAll('[data-image-choice]').forEach(button => {
    button.addEventListener('click', () => answerImage(button.dataset.imageChoice));
  });
}

function answerImage(id) {
  if (imageAnswered) return;
  imageAnswered = true;
  const correct = id === imageCurrent.id;
  const feedback = quizView.querySelector('#image-feedback');
  if (!feedback) return;

  feedback.innerHTML = `
    <div class="feedback">
      <strong>${correct ? 'Correct!' : 'Not quite.'}</strong>
      This is <b>${imageCurrent.name}</b>. ${imageCurrent.clue}
      <div class="toolbar"><button id="image-next" class="primary" type="button">Next cloud</button></div>
    </div>
  `;

  quizView.querySelectorAll('[data-image-choice]').forEach(button => {
    button.disabled = true;
  });

  quizView.querySelector('#image-next')?.addEventListener('click', () => {
    chooseImageQuestion();
    renderImageQuiz();
  });
}

function handleNavigation(event) {
  const button = event.target.closest('nav button[data-view]');
  if (!button || !quizView) return;
  quizView.classList.toggle('active', button.dataset.view === 'quiz');
}

document.addEventListener('click', handleNavigation);
renderImageQuiz();
