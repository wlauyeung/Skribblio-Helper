const current_word = document.getElementById('currentWord');
const chat_elem = document.getElementById('boxChat');
const input_chat = document.getElementById('inputChat');
const form_chat = document.getElementById('formChat');
const config = { attributes: true, childList: true, subtree: true };

let words = {};

const callback = function (mutations_list, observer) {
  update_solutions(find_solutions(current_word.innerHTML));
};

const observer = new MutationObserver(callback);

const sugg_container = document.createElement('div');

let current_solutions = [];

function find_solutions(clue) {
  const num_words = clue.split(' ').length;
  const lens = clue.split(' ').map(word => word.length);
  clue = clue.replaceAll(' ', '').replaceAll('-', '').toLowerCase();
  if (words[num_words] !== undefined && words[num_words][clue.length] !== undefined) {
    let guesses = words[num_words][clue.length];
    let letter_pos = 0;

    if (num_words > 1) {
      guesses = guesses.filter(guess => guess.lens.every((e, i) => e === lens[i]));
    }

    while (clue.length !== 0) {
      let letter = '';
      while (clue.charAt(0) === '_') {
        clue = clue.substring(1);
        letter_pos++;
      }
      letter = clue.charAt(0).toLowerCase();
      if (letter !== '') {
        guesses = guesses.filter((guess) => guess.letters.charAt(letter_pos) === letter);
      }
      clue = clue.substring(1);
      letter_pos++;
    }
    return guesses;
  } else {
    return [];
  }
}

function update_solutions(solutions, replace = true) {
  sugg_container.innerHTML = '';
  for (const word of solutions) {
    const choice = document.createElement('button');
    choice.innerHTML = word.word;
    choice.addEventListener('mousedown', (e) => {
      input_chat.value = word.word;
      for (let i = 0; i < current_solutions.length; i++) {
        if (current_solutions[i].word === word.word) {
          current_solutions.splice(i, 1);
        }
      }
      choice.click();
      setTimeout(() => { choice.remove() }, 50);
    });
    choice.setAttribute('type', 'submit');
    sugg_container.append(choice);
  }
  if (replace) {
    current_solutions = solutions;
  }
}

fetch('https://www.wlay.me/static/json/words.json')
  .then(res => res.json())
  .then(data => words = data)
  .catch(e => console.log(e));

observer.observe(current_word, config);
sugg_container.setAttribute('class', 'suggestions');
form_chat.append(sugg_container);

input_chat.addEventListener('input', (e) => {
  const guess = input_chat.value;
  const possibilities = find_solutions(current_word.innerHTML)
  const new_possibilities = [];

  if (possibilities.length > 0) {
    for (const possibility of possibilities) {
      if (possibility.word.includes(guess)) {
        new_possibilities.push(possibility);
      }
    }
  }

  update_solutions(new_possibilities, false);
});

form_chat.addEventListener('submit', () => {
  update_solutions(current_solutions);
});