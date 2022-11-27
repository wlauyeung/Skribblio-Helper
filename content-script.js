const currentWord = document.getElementById('game-word');
const gameChat = document.getElementById('game-chat');
const inputForm = gameChat.firstChild.childNodes[2];
const inputChat = inputForm.firstChild;
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
  console.log(hints);
  let clue = '';
  for (let i = 0; i < hints.length - 1; i++) {
    clue += hints.item(i).textContent;
  }
  console.log(clue);
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
  suggContainer.innerHTML = '';
  for (const word of solutions) {
    const choice = document.createElement('button');
    choice.innerHTML = word.word;
    choice.addEventListener('mousedown', (e) => {
      inputChat.value = word.word;
      for (let i = 0; i < currentSolutions.length; i++) {
        if (currentSolutions[i].word === word.word) {
          currentSolutions.splice(i, 1);
        }
      }
      choice.click();
      setTimeout(() => { choice.remove() }, 50);
    });
    choice.setAttribute('type', 'submit');
    suggContainer.append(choice);
  }
  if (replace) {
    currentSolutions = solutions;
  }
}

fetch('https://www.wlay.me/static/json/words.json')
  .then(res => res.json())
  .then(data => words = data)
  .catch(e => console.log(e));

observer.observe(currentWord, config);
suggContainer.setAttribute('class', 'suggestions');
inputForm.append(suggContainer);

inputChat.addEventListener('input', (e) => {
  const guess = inputChat.value;
  const possibilities = findSolutions(unwrapClue(currentWord));
  const newPossibilities = [];

  if (possibilities.length > 0) {
    for (const possibility of possibilities) {
      if (possibility.word.includes(guess)) {
        newPossibilities.push(possibility);
      }
    }
  }

  displaySolutions(newPossibilities, false);
});

gameChat.addEventListener('submit', () => {
  displaySolutions(currentSolutions);
});