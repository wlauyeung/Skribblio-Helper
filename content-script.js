const currentWord = document.getElementById('game-word');
const gameChat = document.getElementById('game-chat');
const inputForm = gameChat.firstChild.childNodes[2];
const inputChatReal = inputForm.firstChild;
const inputChatFake = inputChatReal.cloneNode(true);
const submitBtn = document.createElement('button');
const config = { attributes: true, childList: true, subtree: true };

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
}

class Bot {
  /** @type {Chat} */
  #chat;
  /** @type {Element} */
  #suggContainer;
  /** @type {Element} */
  #words;
  /** @type {Element} */
  #inputForm;
  /** @type {Element} */
  #gameChat;
  /** @type {Element} */
  #indexMode;
  /** @type {Element} */
  #currentWord
  #currentSolutions = [];

  /**
   * @param {Element} realChatNode 
   * @param {Element} fakeChatNode 
   * @param {Element} submitBtn 
   * @param {Element} inputForm 
   * @param {Element} gameChat 
   */
  constructor(realChatNode, fakeChatNode, submitBtn, inputForm, gameChat, currentWord) {
    this.#chat = new Chat(realChatNode, fakeChatNode, submitBtn);
    this.#inputForm = inputForm;
    this.#gameChat = gameChat;
    this.#indexMode = true;
    this.#currentWord = currentWord;

    const callback = (mutations_list, observer, b=this) => {
      b.displaySolutions(b.findSolutions(b.getCurrentWord()));
    };
    
    const observer = new MutationObserver(callback);
    this.#suggContainer = document.createElement('div');
    
    fetch('https://www.wlay.me/static/json/words.json')
    .then(res => res.json())
    .then(data => this.#words = data)
    .catch(e => console.log(e));
  
    observer.observe(currentWord, config);
    this.#suggContainer.setAttribute('class', 'suggestions');
    this.#inputForm.append(this.#suggContainer);
    this.#inputForm.append(submitBtn);
    
    realChatNode.after(inputChatFake);
    realChatNode.style.visibility = 'hidden';
    
    fakeChatNode.addEventListener('input', (e) => {
      const guess = fakeChatNode.value.toLowerCase();
      const possibilities = this.findSolutions(this.getCurrentWord());
      const newPossibilities = [];
    
      if (!isNaN(parseInt(guess))) return;
    
      if (possibilities.length > 0) {
        for (const possibility of possibilities) {
          if (possibility.word.toLowerCase().includes(guess)) {
            newPossibilities.push(possibility);
          }
        }
      }
    
      this.displaySolutions(newPossibilities, false);
    });
    
    fakeChatNode.addEventListener('keypress', (e) => {
      if (e.code === 'Enter') {
        const idx = parseInt(inputChatFake.value);
        if (this.#indexMode && !isNaN(idx) && idx >= 0 
          && idx <= this.#suggContainer.childNodes.length - 1) {
          fakeChatNode.value = this.#suggContainer.childNodes[idx].getAttribute('word');
          this.removeSolution(this.#suggContainer.childNodes[idx]);
        }
        this.#chat.write(inputChatFake.value);
        this.#chat.submit();
      }
    });
    
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        fakeChatNode.focus();
        this.#chat.clear();
        this.displaySolutions(this.#currentSolutions);
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
    
    this.#gameChat.addEventListener('submit', () => {
      this.displaySolutions(this.#currentSolutions);
    });
  }
  
  /**
   * Turns a DOM node that contains the hint into a string
   * that is interruptable by the program.
   * @param {Node} node
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
   * @param {String} clue 
   * @returns {String[]} A list of potential answers
   */
  findSolutions(clue) {
    const numWords = clue.split(' ').length;
    const lens = clue.split(' ').map(word => word.length);
    clue = clue.replaceAll(' ', '').replaceAll('-', '').toLowerCase();
    if (this.#words[numWords] !== undefined && this.#words[numWords][clue.length] !== undefined) {
      let guesses = this.#words[numWords][clue.length];
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
  displaySolutions(solutions, replace = true) {
    let i = 0;
    this.#suggContainer.innerHTML = '';
    for (const word of solutions) {
      const choice = document.createElement('div');
      const index = document.createElement('span');
      const submit = () => {
        this.#chat.write(word.word);
        this.removeSolution(choice);
        this.#chat.submit();
      };
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
        this.#chat.write(word.word);
      });
      choice.append(index);
      this.#suggContainer.append(choice);
      i++;
    }
    if (replace) {
      this.#currentSolutions = solutions;
    }
  }

  /**
   * Remove a possible solution from the suggestion list.
   * @param {Element} solutionNode 
   */
  removeSolution(solutionNode) {
    const word = solutionNode.getAttribute('word');
    for (let i = 0; i < this.#currentSolutions.length; i++) {
      if (this.#currentSolutions[i].word === word) {
        this.#currentSolutions.splice(i, 1);
      }
    }
    setTimeout(() => { solutionNode.remove(); }, 50);
  }

  /**
   * @returns {String} A clue
   */
  getCurrentWord() {
    return this.unwrapClue(currentWord);
  }
}

const bot = new Bot(inputChatReal, inputChatFake, submitBtn, inputForm,
  gameChat, currentWord);