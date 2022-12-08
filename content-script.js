const currentWord = document.getElementById('game-word');
const gameChat = document.getElementById('game-chat');
const inputForm = gameChat.firstChild.childNodes[2];
const inputChatReal = inputForm.firstChild;
const inputChatFake = inputChatReal.cloneNode(true);
const config = { attributes: true, childList: true, subtree: true };

let words = {};

const callback = function (mutations_list, observer) {
  displaySolutions(findSolutions(unwrapClue(currentWord)));
};

const observer = new MutationObserver(callback);

const suggContainer = document.createElement('div');

let currentSolutions = [];

/**
 * Turns a DOM node that contains the hint into a string
 * that is interruptable by the program.
 * @param {Node} node
 * @returns {String} A clue interruptable by findSolutions()
 */
function unwrapClue(node) {
  const hints = node.childNodes[2].firstChild.childNodes;
  let clue = '';
  for (let i = 0; i < hints.length - 1; i++) {
    clue += hints.item(i).textContent;
  }
  return clue;
}

/**
 * Finds a list of pontential answers by filtering out wrong guesses with a clue.
 * @param {String} clue 
 * @returns {String[]} A list of potential answers
 */
function findSolutions(clue) {
  const numWords = clue.split(' ').length;
  const lens = clue.split(' ').map(word => word.length);
  clue = clue.replaceAll(' ', '').replaceAll('-', '').toLowerCase();
  if (words[numWords] !== undefined && words[numWords][clue.length] !== undefined) {
    let guesses = words[numWords][clue.length];
    let letterPos = 0;

    if (numWords > 1) {
      guesses = guesses.filter(guess => guess.lens.every((e, i) => e === lens[i]));
    }

    while (clue.length !== 0) {
      let letter = '';
      while (clue.charAt(0) === '_') {
        clue = clue.substring(1);
        letterPos++;
      }
      letter = clue.charAt(0).toLowerCase();
      if (letter !== '') {
        guesses = guesses.filter((guess) => guess.letters.charAt(letterPos) === letter);
      }
      clue = clue.substring(1);
      letterPos++;
    }
    return guesses;
  } else {
    return [];
  }
}

/**
 * Displays the list of potential solutions under the chat bar.
 * @param {String[]} solutions The list of potential solutions
 * @param {Boolean} replace True if the new answers should replace
 * all of the old ones
 */
function displaySolutions(solutions, replace = true) {
  let i = 0;
  suggContainer.innerHTML = '';
  for (const word of solutions) {
    const choice = document.createElement('div');
    const btn = document.createElement('button');
    const index = document.createElement('span');
    const submit = () => {
      inputChatReal.value = word.word;
      inputChatFake.value = word.word;
      btn.click();
      removeSolution(choice);
    };
    btn.innerHTML = word.word;
    btn.setAttribute('type', 'submit');
    index.innerHTML = i;
    choice.innerHTML = word.word;
    choice.addEventListener('mousedown', submit);
    choice.addEventListener('keypress', e => {
      if (e.code === 'Enter') submit();
    });
    choice.setAttribute('class', 'solution');
    choice.setAttribute('tabindex', '-1');
    choice.setAttribute('word', word.word);
    choice.addEventListener('focus', (e) => {
      const value = word.word;
      inputChatReal.value = value;
      inputChatFake.value = word.word;
    });
    choice.append(index);
    choice.append(btn);
    suggContainer.append(choice);
    i++;
  }
  if (replace) {
    currentSolutions = solutions;
  }
}

/**
 * Remove a possible solution from the suggestion list.
 * @param {Element} solutionNode 
 */
function removeSolution(solutionNode) {
  const word = solutionNode.getAttribute('word');
  for (let i = 0; i < currentSolutions.length; i++) {
    if (currentSolutions[i].word === word) {
      currentSolutions.splice(i, 1);
    }
  }
  setTimeout(() => { solutionNode.remove() }, 50);
}

fetch('https://www.wlay.me/static/json/words.json')
  .then(res => res.json())
  .then(data => words = data)
  .catch(e => console.log(e));

observer.observe(currentWord, config);
suggContainer.setAttribute('class', 'suggestions');
inputForm.append(suggContainer);

inputChatReal.after(inputChatFake);
inputChatReal.style.visibility = 'hidden';

inputChatFake.addEventListener('input', (e) => {
  const guess = inputChatFake.value.toLowerCase();
  const possibilities = findSolutions(unwrapClue(currentWord));
  const newPossibilities = [];

  if (!isNaN(parseInt(guess))) return;

  if (possibilities.length > 0) {
    for (const possibility of possibilities) {
      if (possibility.word.toLowerCase().includes(guess)) {
        newPossibilities.push(possibility);
      }
    }
  }

  displaySolutions(newPossibilities, false);
});

inputChatFake.addEventListener('keypress', (e) => {
  if (e.code === 'Enter') {
    const idx = parseInt(inputChatFake.value);
    if (!isNaN(idx) && idx >= 0 && idx <= suggContainer.childNodes.length - 1) {
      inputChatFake.value = suggContainer.childNodes[idx].getAttribute('word');
      removeSolution(suggContainer.childNodes[idx]);
    }
    inputChatReal.value = inputChatFake.value;
    inputChatReal.click();
  }
});

document.addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    inputChatFake.focus();
    inputChatFake.value = '';
    inputChatReal.value = '';
    displaySolutions(currentSolutions);
  }
  if (e.code === 'Tab') {
    e.preventDefault();
    const solutions = suggContainer.childNodes;
    let node = document.activeElement;
    if (solutions.length === 0) return;
    if (node.className !== 'solution' || node.nextSibling === null) {
      node = solutions[0];
    } else {
      node = node.nextSibling;
    }
    node.focus();
  }
});

gameChat.addEventListener('submit', () => {
  displaySolutions(currentSolutions);
});