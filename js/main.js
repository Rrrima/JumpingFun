import Game from './game.js';

window.onload = function (){
  var game = new Game();

  var startpage = document.querySelector('.startPage');
  var restartpage = document.querySelector('.restartPage');
  var startBtn = document.querySelector('.startBtn');
  var restartBtn = document.querySelector('.restartBtn');
  var scoreEl = document.querySelector('.scoreNum');
  var panel = document.querySelector('#panel');

  startpage.style.display = 'flex';
  restartpage.style.display = 'none';
  panel.style.display = 'none';

  startBtn.addEventListener('click', function (){
    startpage.style.display = 'none';
    panel.style.display = 'block';
    game.start();
  });

  restartBtn.addEventListener('click', function (){
    restartpage.style.display = 'none';
    panel.style.display = 'block';
    game.restart();
  });

  game.failCallback = function (score){
    restartpage.style.display = 'flex';
    panel.style.display = 'none';
    scoreEl.innerHTML = score;
  };
};
