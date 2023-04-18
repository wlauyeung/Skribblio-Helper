const currentWord = document.getElementById('game-word');
const inputForm = document.querySelector('#game-chat > .chat-container  > form');
const inputChatReal = inputForm.querySelector('input');
const inputChatFake = inputChatReal.cloneNode(true);
const submitBtn = document.createElement('button');
const config = { attributes: true, childList: true, subtree: true };
const language = document.querySelector('.container-name-lang > select');
const languages = {
  0: 'en', 1: 'de', 24: 'es', 7: 'fr'
};
const wordBankURL = 'https://wlauyeung.github.io/Skribblio-Word-Bank/';

class Chat {
  /** @type {Element} */
  #realChat
  /** @type {Element} */
  #fakeChat
  /** @type {Element} */
  #submitBtn

  /**
   * @param {Element} realChatNode 
   * @param {Element} fakeChatNode 
   * @param {Element} submitBtnNode 
   */
  constructor(realChatNode, fakeChatNode, submitBtnNode) {
    this.#realChat = realChatNode;
    this.#fakeChat = fakeChatNode;
    this.#submitBtn = submitBtnNode;
  }

  /**
   * Writes a message to the chat.
   * @param {String} text Message
   */
  write(text) {
    this.#realChat.value = text;
    this.#fakeChat.value = text;
  }

  /**
   * Clears the chat.
   */
  clear() {
    this.write('');
  }

  /**
   * Submits the chat.
   */
  submit() {
    this.#submitBtn.click();
  }

  /**
   * Returns the text in the chat.
   */
  text() {
    return this.#fakeChat.value;
  }
}

class Bot {
  /** @type {Chat} */
  #chat;
  /** @type {Element} */
  #suggContainer;
  /** @type {Object[]} */
  #words;
  /** @type {Object[]} */
  #officialWords;
  /** @type {Element} */
  #inputForm;
  /** @type {Element} */
  #currentWord
  /** @type {Boolean} */
  #indexMode;
  /** @type {Boolean} */
  #useOfficialWL;
  /** @type {Number} */
  #sortingMode;
  #currentSolutions = [];
  /** @type {String[]} */
  #submittedWords;
  /** @type {String} */
  #customWLString;
  /** @type {String} */
  #language;

  /**
   * @param {Element} realChatNode 
   * @param {Element} fakeChatNode 
   * @param {Element} submitBtn 
   * @param {Element} inputForm 
   */
  constructor(realChatNode, fakeChatNode, submitBtn, inputForm, currentWord) {
    this.#chat = new Chat(realChatNode, fakeChatNode, submitBtn);
    this.#inputForm = inputForm;
    this.#currentWord = currentWord;
    this.#indexMode = true;
    this.#useOfficialWL = true;
    this.#sortingMode = 3;
    this.#words = {};
    this.#officialWords = {};
    this.#submittedWords = [];
    this.#customWLString = '';
    this.#language = languages[language.value] === undefined ? 'en' : languages[language.value];


    const callback = () => {
      const word = this.getCurrentWord();
      let occurrences = 0;
      for (let i = 0; i < word.length; i++) {
        if (word.charAt(i) === '_') occurrences++;
      }
      if (occurrences === word.length) this.#submittedWords = [];
      this.updateSolutions();
    };
    
    const observer = new MutationObserver(callback);
    this.#suggContainer = document.createElement('div');
    
    fetch(`${wordBankURL}words_${this.#language}_v1.0.0.json`)
    .then(res => res.json())
    .then(data => {
      this.#officialWords = data;
      chrome.storage.sync.get(["customWL"]).then((result) => {
        this.#customWLString = result.customWL;
        this.updateWordList();
      });
    })
    .catch(e => console.log(e));

    chrome.storage.onChanged.addListener((changes, namespace) => {
      for (const key of Object.keys(changes)) {
        if (key === 'indexMode') {
          this.changeIndexMode(changes[key].newValue);
          this.displaySolutions();
        } else if (key === 'sortingMode') {
          const mode = parseInt(changes[key].newValue);
          if (!isNaN(mode)) this.changeSortingMode(mode);
          this.updateSolutions();
        } else if (key === 'customWL') {
          this.#customWLString = changes[key].newValue;
          this.updateWordList();
        } else if (key === 'enableOfficialWL') {
          this.#useOfficialWL = changes[key].newValue;
          this.updateWordList();
        }
      }
    });
  
    observer.observe(this.#currentWord, config);
    this.#suggContainer.setAttribute('class', 'suggestions');
    this.#inputForm.append(this.#suggContainer);
    this.#inputForm.append(submitBtn);
    
    realChatNode.after(inputChatFake);
    realChatNode.style.display = 'none';
    
    fakeChatNode.addEventListener('input', (e) => {
      const guess = fakeChatNode.value.toLowerCase();    
      if (!isNaN(parseInt(guess))) return;
      this.displaySolutions();
    });
    
    fakeChatNode.addEventListener('keypress', (e) => {
      if (e.code === 'Enter') {
        const idx = parseInt(inputChatFake.value);
        if (this.#indexMode && !isNaN(idx) && idx >= 0 
          && idx <= this.#suggContainer.childNodes.length - 1) {
          fakeChatNode.value = this.#suggContainer.childNodes[idx].id.replace('submitBtn-', '');
        }
        this.submit(inputChatFake.value);
      }
    });
    
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey && e.code === 'ControlLeft') ||
        (e.metaKey && e.code === 'MetaLeft')) {
        e.preventDefault();
        fakeChatNode.focus();
        this.#chat.clear();
        this.displaySolutions();
      }
      if (e.code === 'Tab') {
        e.preventDefault();
        const solutions = this.#suggContainer.childNodes;
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

    document.querySelector('.container-name-lang > select').addEventListener('change', (e) => {
      this.#language = languages[language.value] === undefined ? 'en' : languages[language.value];
      fetch(`${wordBankURL}words_${this.#language}_v1.0.0.json`)
      .then(res => res.json())
      .then(data => {
        this.#officialWords = data;
        this.updateWordList();
      })
      .catch(e => console.log(e));
    });
    
    chrome.storage.sync.get(["indexMode"]).then((result) => {
      this.changeIndexMode(result.indexMode);
    });
    chrome.storage.sync.get(["sortingMode"]).then((result) => {
      const mode = parseInt(result.sortingMode);
      if (!isNaN(mode)) this.changeSortingMode(mode);
    });
    chrome.storage.sync.get(["enableOfficialWL"]).then((result) => {
      this.#useOfficialWL = result.enableOfficialWL;
    });
  }
  
  /**
   * Turns a DOM node that contains the hint into a string
   * that is interruptable by the program.
   * @param {Node} node The node containing the hint
   * @returns {String} A clue interruptable by findSolutions()
   */
  unwrapClue(node) {
    const hints = node.childNodes[2].firstChild.childNodes;
    let clue = '';
    for (let i = 0; i < hints.length - 1; i++) {
      clue += hints.item(i).textContent;
    }
    return clue;
  }

  /**
   * Finds a list of pontential answers by filtering out wrong guesses with a clue.
   * @param {String} clue The hint used to search for answers
   * @returns {String[]} A list of potential answers
   */
  findSolutions(clue) {
    const numWords = clue.split(' ').length;
    const lens = clue.split(/[\s-]/).map(word => word.length);
    clue = clue.replaceAll(' ', '').replaceAll('-', '');
    if (this.#words[numWords] !== undefined && this.#words[numWords][clue.length] !== undefined) {
      let guesses = this.#words[numWords][clue.length];
      let letterPos = 0;

      guesses = guesses.filter(guess => guess.lens.every((e, i) => e === lens[i]));
      guesses = guesses.filter(guess => !this.#submittedWords.includes(guess.word.toLowerCase()));

      while (clue.length !== 0) {
        let letter = '';
        while (clue.charAt(0) === '_') {
          clue = clue.substring(1);
          letterPos++;
        }
        letter = clue.charAt(0);
        if (letter !== '') {
          guesses = guesses.filter((guess) => guess.letters.charAt(letterPos) === letter);
        }
        clue = clue.substring(1);
        letterPos++;
      }
      return this.sortSolutions(guesses);
    } else {
      return [];
    }
  }

  /**
   * Displays the list of potential solutions under the chat bar.
   */
  displaySolutions() {
    const text = this.#chat.text();
    let i = 0;
    this.#suggContainer.innerHTML = '';
    for (const word of this.#currentSolutions
      .filter(g => g.word.toLowerCase().includes(text.toLowerCase()))) {
      const choice = document.createElement('div');
      const submit = () => {
        this.submit(word.word);
      };
      choice.innerHTML = word.word;
      choice.addEventListener('mousedown', submit);
      choice.addEventListener('keypress', e => {
        if (e.code === 'Enter') submit();
      });
      choice.setAttribute('class', 'solution');
      choice.setAttribute('tabindex', '-1');
      choice.setAttribute('id', `submitBtn-${word.word}`);
      choice.addEventListener('focus', (e) => {
        this.#chat.write(word.word);
      });
      if (this.#indexMode) {
        const index = document.createElement('span');
        index.innerHTML = i;
        choice.append(index);
      }
      this.#suggContainer.append(choice);
      i++;
    }
  }

  /**
   * Removes a possible solution from the suggestion list.
   * @param {String} solution 
   */
  removeSolution(solution) {
    let word = '';
    for (let i = 0; i < this.#currentSolutions.length; i++) {
      if (this.#currentSolutions[i].word.toLowerCase() === solution.toLowerCase()) {
        word = this.#currentSolutions[i].word;
        this.#currentSolutions.splice(i, 1);
      }
    }
    setTimeout(() => { 
      const btn = document.getElementById(`submitBtn-${word}`);
      if (btn !== null) btn.remove();
    }, 50);
  }

  /**
   * Extracts the hint from the website.
   * @returns {String} The hint
   */
  getCurrentWord() {
    return this.unwrapClue(this.#currentWord);
  }

  /**
   * Updates the index mode according to chrome.storage.
   * @param {Boolean} mode 
   */
  changeIndexMode(mode) {
    this.#indexMode = mode;
  }

  /**
   * Updates the index mode according to chrome.storage.
   * @param {Number} mode 
   */
  changeSortingMode(mode) {
    if (mode < 0) return;
    this.#sortingMode = mode;
  }

  /**
   * Sorts the solutions according to this.#sortingMode.
   * @param {Object} solutions 
   */
  sortSolutions(solutions) {
    switch(this.#sortingMode) {
      case 0:
        return solutions.sort((w1, w2) => w1.word.localeCompare(w2.word));
      case 1:
        return solutions.sort((w1, w2) => w2.picked - w1.picked);
      case 2:
        return solutions.sort((w1, w2) => w2.difficulty - w1.difficulty);
      case 3:
        return solutions.sort((w1, w2) => (w2.picked - w1.picked === 0)
          ? w2.difficulty - w1.difficulty : w2.picked - w1.picked);
    }
    return solutions;
  }

  /**
   * Refreshes the list of solutions using the hint.
   */
  updateSolutions() {
    this.#currentSolutions = this.findSolutions(this.getCurrentWord());
    this.displaySolutions();
  }

  /**
   * Convert a string consists of words delimited by the comma character(,)
   * into an word searchable by the bot.
   * @param {String} wordString e.g. JavaScript, React, Node.js
   */
  addWordList(wordString) {
    if (wordString === '') return;
    const words = wordString.split(/,\s*/);
    for (let word of words) {
      word = word.trim();
      const letters = word.replaceAll(' ', '').replaceAll('-', '');
      if (letters === '') continue;
      const wordArray = word.split(' ');
      const obj = {
          word: word,
          letters: letters,
          lens: word.split(/[\s-]/).map(w => w.length),
          picked: 10000000000, //Prioritize custom words over official words
          difficulty: 1
      };
      if (this.#words[wordArray.length] === undefined) this.#words[wordArray.length] = {};
      if (this.#words[wordArray.length][letters.length] === undefined) this.#words[wordArray.length][letters.length] = [];
      if (this.#words[wordArray.length][letters.length].findIndex((e) => e.word === word) === -1) {
        this.#words[wordArray.length][letters.length].push(obj);
      }
    }
  }

  /**
   * Submits a word.
   * @param {String} word 
   */
  submit(word) {
    this.#chat.write(word);
    this.#submittedWords.push(word.toLowerCase());
    this.removeSolution(word);
    this.#chat.submit();
    this.displaySolutions();
  }

  /**
   * Refreshes the word list with the current configuration.
   */
  updateWordList() {
    this.#words = {};
    if (this.#useOfficialWL) this.#words = structuredClone(this.#officialWords);
    this.addWordList(this.#customWLString);
    this.updateSolutions();
  }
}

const bot = new Bot(inputChatReal, inputChatFake, submitBtn, inputForm, currentWord);