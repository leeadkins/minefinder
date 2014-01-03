/**
 * Super Hacky Fun Time Minesweeper Clone
 */

// the only thing borrowed from anywhere. I didn't feel like doing this myself and just needed some coords.
function relMouseCoords(event){
    var totalOffsetX = 0;
    var totalOffsetY = 0;
    var canvasX = 0;
    var canvasY = 0;
    var currentElement = this;

    do{
        totalOffsetX += currentElement.offsetLeft - currentElement.scrollLeft;
        totalOffsetY += currentElement.offsetTop - currentElement.scrollTop;
    }
    while(currentElement = currentElement.offsetParent)

    canvasX = event.pageX - totalOffsetX;
    canvasY = event.pageY - totalOffsetY;

    return {x:canvasX, y:canvasY}
}
HTMLCanvasElement.prototype.relMouseCoords = relMouseCoords;


/**
 * Originally, the cells were stored in a flat 1D array. This made some things easier,
 * but made understanding and moving around the grid a little strange because everything
 * required a modulo calculation first. I switched it to a 2D array, which makes setting
 * the initial bombs a little weirder, but everything else is a little more straight forward.
 *
 * It wouldn't be a huge deal to switch it back again if it became necessary. That's for sure.
 *
 * Also, yes, the game loops is overkill for this. But it just kind of happened.
 */

$(function() {

    var CELL_SIZE = 32;
    var ROWS = 16;
    var COLS = 16;
    var BOMBS = 20;

    var GAME_STATE = {
        PLAYING: 0,
        LOSE: 1,
        WIN: 2
    };

    var canvas = $("#main_game")[0];
    var ctx = canvas.getContext("2d");
    var cells = [];
    var setFlags = 0;
    var revealedCells = 0;
    var gameState = GAME_STATE.PLAYING;



    var CELL_STATE = {
        HIDDEN: 0,
        REVEALED: 1,
        FLAGGED: 2,
        MARKED: 3
    }

    var Cell = function(x, y) {
        this.posX = x;
        this.posY = y;
        this.state = CELL_STATE.HIDDEN;
        this.hasBomb = false;
    }

    Cell.prototype.reveal = function() {
        if(this.state == CELL_STATE.REVEALED) return;
        this.state = CELL_STATE.REVEALED;
        revealedCells ++;

        this.checkNeighbors();

        /**
         * Not a super huge fan of handling end-game here,
         * but didn't want to do it in the Update since it's be the only thing there.
         */
        if(this.hasBomb) {
            alert("game over");
            gameState = GAME_STATE.LOSE;
        } else if(revealedCells == ROWS * COLS - BOMBS) {
            alert("You win!")
            gameState = GAME_STATE.WIN;
        }

    }

    Cell.prototype.checkNeighbors = function() {

        var cellsToCheckOrUpdate = [];

        var bombCount = 0;

        if(this.posY > 0) {
            if(this.posX > 0)
                cellsToCheckOrUpdate.push(cells[this.posY - 1][this.posX - 1]);
            if(this.posX < COLS - 1)
                cellsToCheckOrUpdate.push(cells[this.posY - 1][this.posX + 1]);
            cellsToCheckOrUpdate.push(cells[this.posY - 1][this.posX]);
        }

        if(this.posX > 0)
            cellsToCheckOrUpdate.push(cells[this.posY][this.posX - 1]);

        if(this.posX < COLS - 1)
            cellsToCheckOrUpdate.push(cells[this.posY][this.posX + 1]);

        if(this.posY < ROWS - 1) {
            if(this.posX > 0)
                cellsToCheckOrUpdate.push(cells[this.posY + 1][this.posX - 1]);
            if(this.posX < COLS - 1)
                cellsToCheckOrUpdate.push(cells[this.posY + 1][this.posX + 1]);
            cellsToCheckOrUpdate.push(cells[this.posY + 1][this.posX]);
        }


        for(var ci = 0; ci < cellsToCheckOrUpdate.length; ci++) {
            var cell = cellsToCheckOrUpdate[ci];
            if(cell.hasBomb) bombCount++;
        }


        this.neighborCount = bombCount;
        if(bombCount == 0) {
            for(var ri = 0; ri < cellsToCheckOrUpdate.length; ri++) {
                var cell = cellsToCheckOrUpdate[ri];
                cell.reveal();
            }
        }
    }

    Cell.prototype.click = function(e) {

        if(this.state != CELL_STATE.REVEALED) {
            if(e.shiftKey == true) {
                if(this.state == CELL_STATE.FLAGGED) {
                    this.state = CELL_STATE.HIDDEN;
                    decrementFlags();
                } else {
                    this.state = CELL_STATE.FLAGGED;
                    incrementFlags();
                }
            } else if(e.altKey == true) {
                if(this.state == CELL_STATE.MARKED) {
                    this.state = CELL_STATE.HIDDEN;
                } else {
                    this.state = CELL_STATE.MARKED;
                }
            } else {
                this.reveal();
            }
        }
    }

    Cell.prototype.render = function() {
        ctx.strokeStyle = "#444";
        if(this.state == CELL_STATE.HIDDEN) {
            ctx.fillStyle = "#ddd";
        } else if(this.state == CELL_STATE.FLAGGED) {
            ctx.fillStyle = "#daa";
        } else if(this.state == CELL_STATE.MARKED) {
            ctx.fillStyle = "#aad";
        } else if(this.state == CELL_STATE.REVEALED) {
            if(this.hasBomb == true) {
                ctx.fillStyle = "#F00";
            } else {
                ctx.fillStyle = "#555";
            }
        }

        if(gameState == GAME_STATE.LOSE && this.hasBomb) {
            ctx.fillStyle = "#F00";
        }

        ctx.strokeRect(this.posX * CELL_SIZE, this.posY * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        ctx.fillRect(this.posX * CELL_SIZE, this.posY * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        if(this.state == CELL_STATE.REVEALED && this.neighborCount > 0) {
            ctx.strokeStyle = "#ddd"
            ctx.strokeText(this.neighborCount, this.posX * CELL_SIZE + 12.5, this.posY * CELL_SIZE + 18, CELL_SIZE);
        }
    }


    /**
     * If one wanted to build the simply UI, just call this again to reset the game.
     */
    Cell.generateCells = function() {
        cells = [];
//        var totalCells = ROWS * COLS;

        for(var y = 0; y < ROWS; y++) {
            var row = [];
            for(var x = 0; x < COLS; x++) {
                row.push(new Cell(x, y));
            }
            cells.push(row);
        }

        // Used when we had a flat array.
//        for(var i = 0; i < totalCells; i++) {
//            cells.push(new Cell(i));
//        }

//        var bombCells = cells.slice(0).sort(function(){return 0.5 - Math.random()});
//        bombCells = bombCells.slice(0,40);

        // Creates a new array, flattens the cells into it, randomizes it, then grabs 40.
        var bombCells = [].concat.apply([], cells).sort(function(){return 0.5 - Math.random()}).slice(0,BOMBS);
        for(var u = 0; u < bombCells.length; u++) {
            var cell = bombCells[u];
            cell.hasBomb = true;
        }

        gameState = GAME_STATE.PLAYING;
    }

    Cell.cellAtTapPoint = function(x0, y0) {
        var x = Math.floor(x0 / CELL_SIZE);
        var y = Math.floor(y0 / CELL_SIZE);

//        var i = y * COLS + x;
        return cells[y][x];
    }


    function incrementFlags() {
        setFlags++;
        $("#mine_count").html(BOMBS - setFlags);
    }

    function decrementFlags() {
        setFlags--;
        $("#mine_count").html(BOMBS - setFlags);
    }


//    function update(dt) {}

    function handleClick(e) {
        var coords = canvas.relMouseCoords(e);
        var cell = Cell.cellAtTapPoint(coords.x, coords.y);
        cell.click(e);
    }

    function render() {
        // Make sure to clear this thing out each time.
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, canvas.width, canvas.height);


        for(var y = 0; y < ROWS; y++) {
            for(var x = 0; x < COLS; x++) {
                var cell = cells[y][x];
                if(cell) {
                    cell.render();
                }
            }
        }

//        for(var i = 0; i < cells.length; i++) {
//            var cell = cells[i];
//            var x0 = i%COLS;
//            var y0 = Math.floor(i/ROWS);
//            cell.render();
//        }
    }


    var lastTime;
    function main() {
        var now = Date.now();
        var dt = (now - lastTime) / 1000.0;

       // Update wasn't really needed for this game.
       // Well, neither was a game loop, but whatevs.
//        update(dt);
        render();

        lastTime = now;
        requestAnimationFrame(main);
    }

    function start() {
        Cell.generateCells();

        canvas.onclick = handleClick;

        main();
    }
    start();
});
