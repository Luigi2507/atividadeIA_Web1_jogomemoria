const nCards = 8;
let cards = [];
const attemptsSpan = document.getElementById('attempts');
const board = document.getElementById("board")

//Array para marcar os pares que foram encontrados
let matchedValues = [];

function createCard(value) {
  const memoryCard = document.createElement("div");
  memoryCard.classList.add("memory-card");
  memoryCard.dataset.cardValue = value;

  const frontFace = document.createElement("div")
  frontFace.classList.add("front-face");
  const backFace = document.createElement("div")
  backFace.classList.add("back-face");

  const frontParagraph = document.createElement("p");
  const backParagraph = document.createElement("p");

  frontParagraph.textContent = value;
  backParagraph.textContent = "?";

  frontFace.appendChild(frontParagraph);
  backFace.appendChild(backParagraph);
  memoryCard.appendChild(frontFace);
  memoryCard.appendChild(backFace);

  return (memoryCard);
}

for (let i = 0; i < nCards; i++) {
  const newCard1 = createCard(i);
  const newCard2 = createCard(i);
  board.appendChild(newCard1);
  board.appendChild(newCard2);
  cards.push(newCard1);
  cards.push(newCard2);
}


let hasFlippedCard = false;
let lockBoard = false; // Bloqueia o tabuleiro para evitar cliques rápidos
let firstCard, secondCard;
let attempts = 0;
let matchedPairs = 0; // Contador de pares encontrados

function flipCard() {
  if (lockBoard) return;
  if (this === firstCard) return;

  this.classList.add('flip');

  if (!hasFlippedCard) {
    hasFlippedCard = true;
    firstCard = this;
   return;
  }

  secondCard = this;
  hasFlippedCard = false;

  checkForMatch();
}

function checkForMatch() {
  attempts++;
  attemptsSpan.textContent = attempts;

  let isMatch = firstCard.dataset.cardValue === secondCard.dataset.cardValue;

  isMatch ? disableCards() : unflipCards();
}

function disableCards() {
  firstCard.removeEventListener('click', flipCard);
  secondCard.removeEventListener('click', flipCard);
 
  matchedPairs++;
  //Quando encontrar o par, adiciona ao array criado "matchedValues"
  matchedValues.push(firstCard.dataset.cardValue);
  
  //Salvamento do estado do jogo, para não perder o progesso caso recarregue ou feche a página
  saveGameState();
  if (matchedPairs === nCards) {
   setTimeout(endGame, 1000);
  }
  resetBoard();
}

function unflipCards() {
  lockBoard = true;

  setTimeout(() => {
    firstCard.classList.remove('flip');
    secondCard.classList.remove('flip');

    //Salva o estado do jogo e atualiza as tentativas feitas pelo jogador
    saveGameState();

    resetBoard();
  }, 1500);
}

function resetBoard() {
  [hasFlippedCard, lockBoard] = [false, false];
  [firstCard, secondCard] = [null, null];
}

//A função shuffle foi movida para fora do IIFE
function shuffle() {
  cards.forEach(card => {
    let randomPos = Math.floor(Math.random() * cards.length);
    card.style.order = randomPos;
  });
}



//Funções usadas para salvar o estado do jogo no depósito do navegador (LocalStorage)

function saveGameState() {
  //Pega a ordem atual das cartas
  const cardOrders = cards.map(card => card.style.order);

  const gameState = {
    attempts: attempts,   //Número de tentativas
    matchedValues: matchedValues,   //Pares encontrados
    cardOrders: cardOrders
  };

  //Salva como um texto JSON no LocalStorage
  localStorage.setItem('memoryGameState', JSON.stringify(gameState));
}


//Função que tenta carregar um jogo salvo, retornado true se houver sucesso e false se não conseguir

function loadGameState() {
  const savedState = localStorage.getItem('memoryGameState');
  if (!savedState) {
    return false; //Não há jogo salvo
  }

  const gameState = JSON.parse(savedState);

  //Restauração do estado do jogo
  attempts = gameState.attempts;
  matchedValues = gameState.matchedValues;
  matchedPairs = matchedValues.length;
  attemptsSpan.textContent = attempts;

  //Restauração da ordem das cartas
  cards.forEach((card, index) => {
    card.style.order = gameState.cardOrders[index];
  });

  //Restauração das cartas que já tinham sido encontradas
  cards.forEach(card => {
    //Se o valor desta carta está no array de pares encontrados
    if (matchedValues.includes(card.dataset.cardValue)) {
      card.classList.add('flip'); //Mantém ela virada
      card.removeEventListener('click', flipCard); //Remover o clique na carta que já está virada
    }
  });

  console.log("Jogo anterior carregado!");
  return true; //Mensagem de retorno do jogo salvo com sucesso
}


//Função que limpa o jogo salvo do LocalStorage

function clearGameState() {
  localStorage.removeItem('memoryGameState');
  console.log("Jogo salvo limpo.");
}


// ===================================================================
// FUNÇÕES DE FIM DE JOGO E SALVAMENTO (Modificadas)
// ===================================================================

function endGame() {
  //Desabilita o tabuleiro
  lockBoard = true;

  //Limpa o jogo salvo assim que o jogo termina.
  clearGameState();

  const playerName = prompt(`Parabéns! Você completou o jogo em ${attempts} tentativas.\n\nDigite seu nome para salvar:`);

  if (playerName && playerName.trim() !== "") {
    saveScoreByAjax(playerName);
  } else {
    alert("Pontuação não salva. Reiniciando o jogo.");
    window.location.href = 'index.php?page=jogar';
  }
}

function saveScoreByAjax(playerName) {
  const formData = new FormData();
  formData.append('nome', playerName);
  formData.append('tentativas', attempts);

  console.log("Enviando (AJAX):", playerName, attempts);

  fetch('salvar_pontuacao.php', {
   method: 'POST',
    body: formData,
    headers: {
      'X-Requested-With': 'XMLHttpRequest'
    }
  })
    .then(response => {
      if (!response.ok) {
        throw new Error(`Erro do servidor: ${response.status}`);
      }
     return response.json();
    })
    .then(data => {
      console.log('Resposta do servidor (AJAX):', data.message);
      alert("Pontuação salva! Redirecionando para o placar.");
      window.location.href = 'index.php?page=placar';
   })
    .catch(error => {
      console.error('Falha ao salvar pontuação via AJAX:', error);
      alert('Houve um erro ao salvar sua pontuação. Verifique o console.');
      window.location.href = 'index.php?page=jogar';
    });
}

/*
function saveScoreByForm(playerName) {
  console.log("Enviando (Formulário Oculto):", playerName, attempts);
  document.getElementById('hiddenName').value = playerName;
  document.getElementById('hiddenAttempts').value = attempts;
  document.getElementById('scoreForm').submit();
}
*/

//Função nova de inicialização do jogo

function initializeGame() {
  //Tenta carregar um jogo
  const gameLoaded = loadGameState();

  if (!gameLoaded) {
    //Se não houver jogo salvo, embaralha e salva o novo estado
    console.log("Iniciando novo jogo.");
    shuffle();
    saveGameState(); //Salva a ordem inicial e tentativas = 0
  }
  
  //Adiciona o evento de clique a cada uma das cartas para que permita o clique após o carregamento/inicialização
  cards.forEach(card => card.addEventListener('click', flipCard));
}

//Nova função para iniciar o jogo
initializeGame();
