import "./styles.css";

function App() {
	this.state = {
		status: "SETUP",
		winner: "-",
		play: false,
		isValid: true,
		isPlayersTurn: null,
		orentation: "V",
		selectedShip: null,
		hoverCoordinate: null,
		tempCoordinates: null,
		playerBombs: [],
		enemyBombs: [],
		enemySuccessfulBombs: [],
		plottedShips: {
			carrier: [],
			battleship: [],
			cruiser: [],
			submarine: [],
			destroyer: []
		},
		plottedEnemyShips: {
			carrier: [],
			battleship: [],
			cruiser: [],
			submarine: [],
			destroyer: []
		}
	};
	this.renderOnStateChange = {
		plottedShips: ["checkPlay", "renderPlayerShips"],
		plottedEnemyShips: ["renderPlayerBombs"],
		selectedShip: ["renderShipList", "renderPlayerGrid"],
		orentation: ["renderOnOrenationChange"],
		tempCoordinates: ["renderPlayerShips"],
		play: ["renderPlayButton"],
		isPlayersTurn: ["renderTurn", "enemysTurn"],
		playerBombs: ["renderPlayerBombs"],
		enemyBombs: ["renderPlayerShips"],
		winner: ["renderWinner", "renderPlayButton"]
	};
	this.elements = {
		winner: {
			stateVariables: [],
			element: document.getElementById("winner")
		},
		play: {
			stateVariables: [],
			element: document.getElementById("play")
		},
		turn: {
			stateVariables: [],
			element: document.getElementById("turn")
		},
		orentation: {
			stateVariables: [],
			element: document.getElementById("orentation")
		},
		selectableShips: {
			stateVariables: [],
			element: document.getElementById("selectable-ships")
		},
		playerGrid: {
			stateVariables: [],
			element: document.getElementById("player-grid")
		},
		enemyGrid: {
			stateVariables: [],
			element: document.getElementById("enemy-grid")
		}
	};
	this.ships = {
		carrier: { size: 5, label: "Carrier", order: 1 },
		battleship: { size: 4, label: "Battleship", order: 2 },
		cruiser: { size: 3, label: "Cruiser", order: 3 },
		submarine: { size: 3, label: "Submarine", order: 4 },
		destroyer: { size: 2, label: "Destroyer", order: 5 }
	};

	this.expectedWinningBombHits = 0;
	const shipKeys = Object.keys(this.ships);
	for (let x = 0; x < shipKeys.length; x++) {
		const ship = this.ships[shipKeys[x]];
		this.expectedWinningBombHits += ship.size;
	}

	// Initialize the app
	this.makePlayerGridActive();
	this.renderShipList(this.state, {});
	this.renderPlayerShips(this.state, {});

	this.elements.orentation.element.textContent =
		this.state.orentation === "H" ? "Horizontal" : "Vertical";

	this.elements.orentation.element.addEventListener("click", () => {
		this.toggleOrentation();
	});

	this.elements.play.element.addEventListener("click", () => {
		this.startGame();
	});
}

App.prototype.startGame = function() {
	this.generateEnemyShips();
	this.makeEnemyGridActive();
	this.updateState({
		status: "STARTED",
		play: false,
		isPlayersTurn: Math.round(Math.random() * 1) === 0 ? true : false
	});
};

App.prototype.selectShip = function(event, selectedShip) {
	if (this.state.status !== "SETUP") {
		return false;
	}

	let plottedShips = {};
	if (this.state.selectedShip === selectedShip) {
		selectedShip = null;
		plottedShips = {
			...this.state.plottedShips
		};
	} else {
		plottedShips = {
			...this.state.plottedShips,
			[selectedShip]: []
		};
	}
	this.updateState({
		selectedShip,
		plottedShips
	});
};

App.prototype.onMouseClickEnemyCoordinate = function(event) {
	if (this.state.isPlayersTurn === true) {
		const coordinate = parseInt(event.target.dataset.coord, 10);
		this.updateState({
			isPlayersTurn: false,
			playerBombs: Array.from(
				new Set([...this.state.playerBombs, coordinate])
			)
		});
	}
};

App.prototype.onMouseEnterEnemyCooridate = function(event) {};

App.prototype.onMouseClickPlayerCoordinate = function(event) {
	if (this.state.selectedShip !== null) {
		let isValid =
			this.validateCoordinates(this.state.tempCoordinates) &&
			this.isCoordiateCollissionFree(
				this.state.tempCoordinates,
				this.state.plottedShips
			);
		if (isValid) {
			const plottedShips = {
				...this.state.plottedShips,
				[this.state.selectedShip]: this.state.tempCoordinates
			};
			this.updateState({
				selectedShip: null,
				hoverCoordinate: null,
				plottedShips,
				tempCoordinates: null
			});
		}
	}
};

App.prototype.onMouseEnterPlayerCooridate = function(event) {
	if (this.state.selectedShip !== null) {
		const coordinate = parseInt(event.target.dataset.coord, 10);
		this.plotShipFromCoordinate(coordinate);
	}
};

App.prototype.plotShipFromCoordinate = function(coordinate) {
	const orentation = this.state.orentation;
	const selectedShip = this.ships[this.state.selectedShip];
	const tempCoordinates = Array.from(
		{ length: selectedShip.size },
		(v, i) => coordinate + (orentation === "H" ? i : i * 10)
	);
	const isValid = this.validateCoordinates(tempCoordinates);
	this.updateState({
		isValid,
		hoverCoordinate: coordinate,
		tempCoordinates
	});
};

App.prototype.generateEnemyBombAttempt = function() {
	let enemySuccessfulBombs = [...this.state.enemySuccessfulBombs];
	let enemyBombs = [...this.state.enemyBombs];

	if (enemySuccessfulBombs.length === 0) {
	}

	let randomCoordinate = Math.floor(Math.random() * 100) + 1;
	while (enemyBombs.includes(randomCoordinate) === true) {
		randomCoordinate = Math.floor(Math.random() * 100) + 1;
	}

	if (this.isCoordinateBombed(randomCoordinate, this.state.plottedShips)) {
		enemySuccessfulBombs.push(randomCoordinate);
	}

	enemyBombs.push(randomCoordinate);

	this.updateState({
		enemyBombs,
		enemySuccessfulBombs,
		isPlayersTurn: true
	});
};

App.prototype.generateEnemyShips = function() {
	let plottedEnemyShips = {
		carrier: [],
		battleship: [],
		cruiser: [],
		submarine: [],
		destroyer: []
	};
	const skipKeys = Object.keys(this.ships);
	for (let x = 0; x < skipKeys.length; x++) {
		const shipKey = skipKeys[x];
		const ship = this.ships[shipKey];
		let isValid = false;
		while (isValid === false) {
			const randomFirstCoordinate = Math.floor(Math.random() * 100) + 1;
			const randomOrentation =
				Math.round(Math.random()) === 0 ? "H" : "V";
			const tempCoordinates = Array.from(
				{ length: ship.size },
				(v, i) =>
					randomFirstCoordinate +
					(randomOrentation === "H" ? i : i * 10)
			);

			isValid =
				this.validateCoordinates(tempCoordinates) &&
				this.isCoordiateCollissionFree(
					tempCoordinates,
					plottedEnemyShips
				);

			if (isValid) {
				plottedEnemyShips[shipKey] = tempCoordinates;
			}
		}
	}
	this.updateState({
		plottedEnemyShips
	});
};

App.prototype.makePlayerGridActive = function() {
	const cooridnateElements = document.getElementsByClassName(
		"selectable player"
	);
	for (let i = 0; i < cooridnateElements.length; i++) {
		const element = cooridnateElements[i];
		element.addEventListener(
			"mouseenter",
			this.onMouseEnterPlayerCooridate.bind(this)
		);
		element.addEventListener(
			"click",
			this.onMouseClickPlayerCoordinate.bind(this)
		);
	}
};

App.prototype.makeEnemyGridActive = function() {
	const cooridnateElements = document.getElementsByClassName(
		"selectable enemy"
	);
	for (let i = 0; i < cooridnateElements.length; i++) {
		const element = cooridnateElements[i];
		element.addEventListener(
			"mouseenter",
			this.onMouseEnterEnemyCooridate.bind(this)
		);
		element.addEventListener(
			"click",
			this.onMouseClickEnemyCoordinate.bind(this)
		);
	}
};

// Renderers
App.prototype.renderWinner = function(newState, oldState) {
	this.elements.winner.element.textContent = newState.winner;
};

App.prototype.renderTurn = function(newState, oldState) {
	this.elements.turn.element.textContent =
		newState.isPlayersTurn === true ? "Yours" : "Enemy";

	if (newState.isPlayersTurn === true) {
		this.elements.enemyGrid.element.classList.add("active");
	} else {
		this.elements.enemyGrid.element.classList.remove("active");
	}
};

App.prototype.enemysTurn = function(newState, oldState) {
	// do a winner check
	const winner = this.getWinner(newState);
	if (winner !== false) {
		this.updateState({
			status: "GAME_OVER",
			winner
		});
	} else {
		if (newState.isPlayersTurn === false) {
			this.generateEnemyBombAttempt();
		}
	}
};

App.prototype.checkPlay = function(newState, oldState) {
	const play = this.completedPlotting(newState.plottedShips);
	this.updateState({ play });
};

App.prototype.renderPlayButton = function(newState, oldState) {
	if (newState.play === true) {
		this.elements.play.element.disabled = false;
	} else {
		this.elements.play.element.disabled = true;
	}

	if (newState.status === "STARTED") {
		this.elements.play.element.textContent = "STARTED";
	}

	if (newState.status === "GAME_OVER") {
		this.elements.play.element.textContent = "GAME OVER";
	}
};

App.prototype.renderOnOrenationChange = function(newState, oldState) {
	if (newState.hoverCoordinate !== null) {
		this.plotShipFromCoordinate(newState.hoverCoordinate);
	}
	this.elements.orentation.element.textContent =
		newState.orentation === "H" ? "Horizontal" : "Vertical";
};

App.prototype.renderShipList = function(newState, oldState) {
	const shipKeys = Object.keys(this.ships);
	this.elements.selectableShips.element.textContent = "";
	for (let i = 0; i < Object.keys(this.ships).length; i++) {
		const shipKey = shipKeys[i];
		const ship = this.ships[shipKey];
		const bombElement = document.createElement("div");
		bombElement.textContent = "💣";
		bombElement.classList.add("bomb");
		const selectShipElement = document.createElement("div");
		selectShipElement.classList.add("select-ship");
		selectShipElement.classList.add(shipKey);
		if (newState.selectedShip === shipKey) {
			selectShipElement.classList.add("selected");
		}
		if (newState.plottedShips[shipKey].length > 0) {
			selectShipElement.classList.add("strike");
		}
		selectShipElement.textContent = `${ship.label} (${ship.size})`;
		selectShipElement.onclick = event => this.selectShip(event, shipKey);
		//selectShipElement.appendChild(bombElement);
		this.elements["select_ship_" + shipKey] = {
			stateVariables: ["selectedShip"],
			element: selectShipElement
		};
		this.elements.selectableShips.element.appendChild(selectShipElement);
	}
};

App.prototype.renderEnemyShips = function(newState, oldState) {
	const playerGridElements = document.getElementsByClassName(
		"col selectable enemy"
	);

	const plottedShips = { ...newState.plottedEnemyShips };

	for (let i = 0; i < playerGridElements.length; i++) {
		const element = playerGridElements[i];
		element.className = "col selectable enemy";
	}

	for (const shipKey in plottedShips) {
		const coordinates = plottedShips[shipKey];
		const isValid = this.validateCoordinates(coordinates);
		for (let x = 0; x < coordinates.length; x++) {
			const coord = parseInt(coordinates[x], 10);
			if (coord <= 100 && coord >= 1) {
				const element = document.getElementById(
					`enemy-coord-${coord.toString()}`
				);
				element.classList.add(isValid ? shipKey : "error");
			}
		}
	}
};

App.prototype.renderPlayerShips = function(newState, oldState) {
	const playerGridElements = document.getElementsByClassName(
		"col selectable player"
	);

	const plottedShips = { ...newState.plottedShips };

	// Reset grid
	for (let i = 0; i < playerGridElements.length; i++) {
		const element = playerGridElements[i];
		element.className = "col selectable player";
	}

	// Plot ship
	for (const shipKey in plottedShips) {
		const coordinates = plottedShips[shipKey];
		const isValid = this.validateCoordinates(coordinates);
		for (let x = 0; x < coordinates.length; x++) {
			const coord = parseInt(coordinates[x], 10);
			if (coord <= 100 && coord >= 1) {
				const element = document.getElementById(
					`coord-${coord.toString()}`
				);
				element.classList.add(isValid ? shipKey : "error");
			}
		}
	}

	// Plot bombs or misses
	for (const coordinate of newState.enemyBombs) {
		const element = document.getElementById(
			`coord-${coordinate.toString()}`
		);
		element.classList.add(
			this.isCoordinateBombed(coordinate, plottedShips)
				? "bomb"
				: "missed"
		);
	}

	// Plot temp coords
	if (newState.tempCoordinates !== null && newState.selectedShip !== null) {
		const isValid =
			this.validateCoordinates(newState.tempCoordinates) &&
			this.isCoordiateCollissionFree(
				newState.tempCoordinates,
				newState.plottedShips
			);
		for (let m = 0; m < newState.tempCoordinates.length; m++) {
			const coord = parseInt(newState.tempCoordinates[m], 10);
			if (coord <= 100 && coord >= 1) {
				const element = document.getElementById(
					`coord-${coord.toString()}`
				);
				element.classList.add(
					isValid ? newState.selectedShip : "error"
				);
			}
		}
	}
};

App.prototype.renderPlayerBombs = function(newState, oldState) {
	const enemyGridElements = document.getElementsByClassName(
		"col selectable enemy"
	);

	for (let i = 0; i < enemyGridElements.length; i++) {
		const element = enemyGridElements[i];
		element.className = "col selectable enemy";
	}

	for (const coordinate of newState.playerBombs) {
		const element = document.getElementById(
			`enemy-coord-${coordinate.toString()}`
		);
		element.classList.add(
			this.isCoordinateBombed(coordinate, newState.plottedEnemyShips)
				? "bomb"
				: "missed"
		);
	}
};

App.prototype.renderPlayerGrid = function(newState, oldState) {
	this.toggleClass(this.elements.playerGrid.element, "active");
};

// Utilties
App.prototype.updateState = function(updatedState) {
	const oldState = { ...this.state };
	const newState = {
		...this.state,
		...updatedState
	};
	this.state = newState;
	const variableNames = Object.keys(updatedState);
	variableNames.forEach(variable => {
		if (
			typeof this.renderOnStateChange[variable] !== "undefined" &&
			newState[variable] !== oldState[variable]
		) {
			this.renderOnStateChange[variable].forEach(renderer => {
				this[renderer](newState, oldState);
			});
		}
	});
};

App.prototype.isCoordiateCollissionFree = function(coordinates, plottedShips) {
	if (coordinates.length === 0) {
		return true;
	}
	// ensure we have no colissions
	const flattendCoordinates = this.flattenCoordinates(plottedShips);

	for (let i = 0; i < flattendCoordinates.length; i++) {
		for (let m = 0; m < coordinates.length; m++) {
			if (coordinates[m] === flattendCoordinates[i]) {
				return false;
			}
		}
	}

	return true;
};

App.prototype.getWinner = function(newState) {
	const playerBombs = newState.playerBombs;
	const enemyBombs = newState.enemyBombs;

	const playerShips = newState.plottedShips;
	const enemeyShips = newState.plottedEnemyShips;

	let totalSuccesfulPlayerBombs = 0;
	for (let m = 0; m < playerBombs.length; m++) {
		const coordinate = playerBombs[m];
		if (this.isCoordinateBombed(coordinate, enemeyShips)) {
			totalSuccesfulPlayerBombs += 1;
		}
	}

	let totalSuccesfulEnemyBombs = 0;
	for (let m = 0; m < enemyBombs.length; m++) {
		const coordinate = enemyBombs[m];
		if (this.isCoordinateBombed(coordinate, playerShips)) {
			totalSuccesfulEnemyBombs += 1;
		}
	}

	if (
		totalSuccesfulEnemyBombs === this.expectedWinningBombHits &&
		totalSuccesfulPlayerBombs === this.expectedWinningBombHits
	) {
		return "DRAW";
	} else if (totalSuccesfulPlayerBombs === this.expectedWinningBombHits) {
		return "YOU";
	} else if (totalSuccesfulEnemyBombs === this.expectedWinningBombHits) {
		return "ENEMY";
	} else {
		return false;
	}
};

App.prototype.isCoordinateBombed = function(coordinate, plottedShips) {
	const flattendCoordinates = this.flattenCoordinates(plottedShips);
	for (let i = 0; i < flattendCoordinates.length; i++) {
		if (coordinate === flattendCoordinates[i]) {
			return true;
		}
	}
	return false;
};

App.prototype.validateCoordinates = function(coordinates) {
	if (coordinates.length === 0) {
		return true;
	}

	const totalElements = coordinates.length - 1;
	const firstCoordinate = coordinates[0];
	const lastCoordinate = coordinates[coordinates.length - 1];

	const lowerBound = firstCoordinate - ((firstCoordinate - 1) % 10);
	const upperBound = lowerBound + 9;

	const isHorizontal =
		lastCoordinate === firstCoordinate + totalElements * 10;

	if (isHorizontal) {
		if (lastCoordinate > 100) {
			return false;
		}
	} else {
		if (lastCoordinate > upperBound) {
			return false;
		}
	}

	return true;
};

App.prototype.completedPlotting = function(plottedShips) {
	const coords = Object.values(plottedShips);
	for (let x = 0; x < coords.length; x++) {
		const coordinates = coords[x];
		if (coordinates.length <= 0) {
			return false;
		}
	}

	return true;
};

App.prototype.flattenCoordinates = function(plottedShips) {
	return Object.values(plottedShips).reduce((x, v) => x.concat(v));
};

App.prototype.toggleOrentation = function() {
	if (this.state.status !== "SETUP") {
		return true;
	}

	const orentation = this.state.orentation === "H" ? "V" : "H";
	this.updateState({
		orentation
	});
	return true;
};

App.prototype.toggleClass = function(element, className) {
	if (element.classList.contains(className)) {
		element.classList.remove(className);
	} else {
		element.classList.add(className);
	}
};

/**
 * The main app
 */
const app = new App();

document.addEventListener("keydown", event => {
	if (event.keyCode === 82) {
		app.toggleOrentation();
	}
});
