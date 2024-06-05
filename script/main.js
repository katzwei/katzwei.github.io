"use strict"

class Tile {
    constructor(content = "") {
        this.content = content;
    }
}

class Block extends Tile {
    constructor(position, content) {
        super(content);
        this.position = position;
    }
}

class Player extends Block {
    constructor(position) {
        super(position, Math.random() > 0.1 ? "player-tile" : "dragon-tile");
    }
}

class Board {
    constructor(boardSize, ...tiles) {
        this.boardSize = boardSize;
        this.tiles = tiles;
    }
    get(position) {
        return this.tiles[position];
    }
    set(position, tile) {
        this.tiles[position] = tile;
    }
    update(position, tile) {
        this.set(position, tile);
        this.tiles[position].element = this.draw(this.get(position));
    }
    build() {
        this.tileElemethis.tiles.forEach(t => {
            const dom = document.createElement("div");
            dom.classList.add("tile");
            t.element = dom;
            this.draw(t);
            return dom;
        });
        return this.tiles.map(t => t.element);
    }
    clear() {
        this.tiles.forEach(t => t.clear());
    }
    draw() {
        this.tiles.forEach(t => t.draw());
    }
}

class Game {
    constructor(element, board, player, ...blocks) {
        this.element = element;
        this.board = board;
        this.player = player;
        this.board.set(this.player.position, this.player);
        for (const block of blocks) this.board.set(block.position, block);
        addEventListener("keydown", (({ key }) => {
            const callback = {
                "ArrowLeft": this.move.bind(this, this.player, -1),
                "ArrowUp": this.move.bind(this, this.player, -this.board.boardSize),
                "ArrowRight": this.move.bind(this, this.player, 1),
                "ArrowDown": this.move.bind(this, this.player, this.board.boardSize),
            }[key];
            callback?.();
        }).bind(this));
        if (navigator.maxTouchPoints) {
            addEventListener("touchstart", (({ touches }) => {
                this.touchStart = {
                    x: touches[0].clientX,
                    y: touches[0].clientY,
                };
            }).bind(this));
            addEventListener("touchmove", (({ touches }) => {
                this.touchDiff = {
                    x: this.touchStart.x - touches[0].clientX,
                    y: this.touchStart.y - touches[0].clientY
                };
            }).bind(this));
            addEventListener("touchend", (_ => {
                if (Math.abs(this.touchDiff.x) > Math.abs(this.touchDiff.y)) this.move(this.player, this.touchDiff.x > 0 ? -1 : 1);
                else this.move(this.player, this.board.boardSize * (this.touchDiff.y > 0 ? -1 : 1));
                this.touchDiff = { x: 0, y: 0 };
            }).bind(this));
        }
    }
    #tryPosition(originPosition, targetPosition) {
        const distance = Math.abs(targetPosition - originPosition);
        const weightedModulo = Math.abs((originPosition % this.board.boardSize) - (targetPosition % this.board.boardSize));
        return (distance === this.board.boardSize                                   // vertical movement is a jump accross the full width of the board
            || (distance === 1 && weightedModulo === 1))                            // horizontal movement must be on the same line
            && (targetPosition >= 0 && targetPosition < this.board.boardSize ** 2); // any movement out of bounds is denied
    }
    #targetIsBlock(position) {
        return this.board.get(position) instanceof Block;
    }
    move(block, position) {
        const targetPosition = block.position + position;
        if (this.#tryPosition(block.position, targetPosition)) {
            const targetTile = this.board.get(targetPosition);
            const targetIsBlock = targetTile instanceof Block;
            const targetPushable = targetIsBlock
                && this.#tryPosition(targetTile.position, targetTile.position + position)
                && !this.#targetIsBlock(targetTile.position + position, targetTile.position + position * 2);
            if (!targetIsBlock || targetPushable) {
                this.clearTile(this.boardElements[block.position], block);
                this.drawTile(this.boardElements[targetPosition], block);
                this.board.set(block.position, (targetPushable ? new Tile() : targetTile));
                block.position = targetPosition;
                this.board.set(targetPosition, block);
                if (targetPushable) this.move(targetTile, position);
            }
        }
    }
    #buildBoard() {
        this.boardElements = this.board.tiles.map(_ => {
            const element = document.createElement("div");
            element.classList.add("tile");
            return element;
        });
        return this.boardElements;
    }
    #tileIsPlayer(tile) {
        return tile instanceof Player;
    }
    clearTile(element, tile) {
        if (this.#tileIsPlayer(tile)) {
            element.classList.remove(tile.content);
        } else {
            element.innerText = "";
        }
    }
    clearBoard() {
        this.boardElements.forEach((e, i) => {
            this.clearTile(e, this.board.get(i));
        })
    }
    drawTile(element, tile) {
        if (this.#tileIsPlayer(tile)) {
            element.classList.add(tile.content);
        } else {
            element.innerText = tile.content;
        }
    }
    drawBoard() {
        this.boardElements.forEach((e, i) => {
            this.drawTile(e, this.board.get(i));
        });
    }
    start() {
        this.element.append(...this.#buildBoard());
        this.drawBoard();
    }
}

(() => {
    const gameElement = document.querySelector("#game-container");
    const boardElement = document.querySelector("#game-board");
    const boardSize = 10;
    const tilesCount = boardSize ** 2;
    const getGameBounds = () => {
        const style = getComputedStyle(gameElement);
        return ({
            height: gameElement.clientHeight - parseInt(style.paddingTop) - parseInt(style.paddingBottom),
            width: gameElement.clientWidth - parseInt(style.paddingLeft) - parseInt(style.paddingRight)
        });
    };
    const getTileSize = () => {
        const gameBounds = getGameBounds();
        return 2 * Math.trunc(((gameBounds.width > gameBounds.height ? gameBounds.height : gameBounds.width) / boardSize) * 0.5); // round to the lowest even integer
    }
    const tiles = [...Array(tilesCount)].map(_ => new Tile());
    const game = new Game(
        boardElement,
        new Board(boardSize, ...tiles),
        new Player(33),
        new Block(12, "toe"),
        new Block(41, "mah"),
        new Block(55, "@"),
        new Block(17, "pro"),
        new Block(25, "ton"),
        new Block(58, "mail"),
        new Block(38, "."),
        new Block(53, "com")
    );
    const computeBoardConstraints = _ => boardElement.style.gridTemplateColumns = `repeat(${boardSize}, minmax(0, ${getTileSize()}px))`;
    computeBoardConstraints();
    addEventListener("resize", computeBoardConstraints);
    game.start();
})();