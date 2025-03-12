// Game configuration
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

// Initialize Phaser game
const game = new Phaser.Game(config);

// Global variables
let territories, selectedTerritory, playerGold = 100, enemyGold = 100, turn = "Player", instructions, mapBackground, gameText;

function preload() {
    // Load assets (replace URLs with actual file paths)
    this.load.image('map', 'assets/map.png'); // Custom map image
    this.load.image('castle_player', 'assets/castle_player.png');
    this.load.image('castle_enemy', 'assets/castle_enemy.png');
    this.load.image('castle_neutral', 'assets/castle_neutral.png');
}

function create() {
    // Add map background
    mapBackground = this.add.image(400, 300, 'map').setDisplaySize(800, 600);

    // Define territories with detailed properties
    territories = {
        "Northland": { 
            x: 200, y: 100, 
            owner: "Player", 
            army: 50, 
            goldIncome: 15, 
            neighbors: ["Westland", "Eastland", "Highland"], 
            sprite: null 
        },
        "Southland": { 
            x: 200, y: 400, 
            owner: "Enemy", 
            army: 30, 
            goldIncome: 10, 
            neighbors: ["Westland", "Eastland"], 
            sprite: null 
        },
        "Eastland": { 
            x: 500, y: 250, 
            owner: "Enemy", 
            army: 40, 
            goldIncome: 12, 
            neighbors: ["Northland", "Southland", "Midland"], 
            sprite: null 
        },
        "Westland": { 
            x: 100, y: 250, 
            owner: "Neutral", 
            army: 20, 
            goldIncome: 8, 
            neighbors: ["Northland", "Southland", "Midland"], 
            sprite: null 
        },
        "Midland": { 
            x: 300, y: 250, 
            owner: "Neutral", 
            army: 25, 
            goldIncome: 10, 
            neighbors: ["Eastland", "Westland", "Highland"], 
            sprite: null 
        },
        "Highland": { 
            x: 300, y: 150, 
            owner: "Player", 
            army: 35, 
            goldIncome: 12, 
            neighbors: ["Northland", "Midland"], 
            sprite: null 
        }
    };

    // Create territory sprites and text
    for (let name in territories) {
        let t = territories[name];
        let spriteKey = t.owner === "Player" ? 'castle_player' : t.owner === "Enemy" ? 'castle_enemy' : 'castle_neutral';
        t.sprite = this.add.sprite(t.x, t.y, spriteKey).setScale(0.5).setInteractive();
        t.sprite.on('pointerdown', () => handleTerritoryClick(name));
        this.add.text(t.x - 20, t.y - 40, name.slice(0, 3), { fontSize: '16px', color: '#fff' });
        t.armyText = this.add.text(t.x - 20, t.y + 30, `Army: ${t.army}`, { fontSize: '14px', color: '#fff' });
    }

    // UI elements
    gameText = {
        gold: this.add.text(10, 10, `Gold: ${playerGold}`, { fontSize: '20px', color: '#fff' }),
        turn: this.add.text(10, 40, `Turn: ${turn}`, { fontSize: '20px', color: '#fff' }),
        status: this.add.text(10, 70, '', { fontSize: '16px', color: '#fff' })
    };

    // Instructions
    instructions = this.add.text(400, 300, 
        "Crown Conquest Online\n" +
        "Objective: Conquer all territories to become king.\n" +
        "1. Click a territory to select it (yellow highlight).\n" +
        "2. Click another to move armies or attack.\n" +
        "3. Press 'R' to recruit (20 gold, +10 soldiers).\n" +
        "4. Earn gold per territory per turn.\n" +
        "5. Press 'I' to toggle instructions.\n" +
        "Click to start!", 
        { fontSize: '20px', color: '#fff', align: 'center' }
    ).setOrigin(0.5);
    instructions.setVisible(true);

    // Keyboard controls
    this.input.keyboard.on('keydown-I', () => instructions.setVisible(!instructions.visible));
    this.input.keyboard.on('keydown-R', () => recruitSoldiers());
}

function update() {
    // Update territory army text
    for (let name in territories) {
        territories[name].armyText.setText(`Army: ${territories[name].army}`);
    }
    // Update UI
    gameText.gold.setText(`Gold: ${playerGold}`);
    gameText.turn.setText(`Turn: ${turn}`);

    // Check win condition
    let playerTerritories = Object.values(territories).filter(t => t.owner === "Player").length;
    let totalTerritories = Object.keys(territories).length;
    if (playerTerritories === totalTerritories) {
        gameText.status.setText("Victory! You are the King!");
        this.scene.pause();
    } else if (playerTerritories === 0) {
        gameText.status.setText("Defeat! The enemy prevails.");
        this.scene.pause();
    }

    // Handle enemy turn
    if (turn === "Enemy") {
        enemyTurn();
        turn = "Player";
        playerGold += Object.values(territories)
            .filter(t => t.owner === "Player")
            .reduce((sum, t) => sum + t.goldIncome, 0);
    }
}

function handleTerritoryClick(name) {
    if (instructions.visible) {
        instructions.setVisible(false);
        return;
    }
    if (turn !== "Player") return;

    let t = territories[name];
    if (!selectedTerritory && t.owner === "Player") {
        selectedTerritory = name;
        t.sprite.setTint(0xffff00); // Highlight selected
        gameText.status.setText(`Selected: ${name}`);
    } else if (selectedTerritory) {
        let selected = territories[selectedTerritory];
        selected.sprite.clearTint();
        if (t.owner === "Player" && selected.neighbors.includes(name)) {
            // Move armies
            let amount = parseInt(prompt(`Move armies from ${selectedTerritory} to ${name} (Max: ${selected.army - 1}):`, "0"));
            if (amount > 0 && amount < selected.army) {
                selected.army -= amount;
                t.army += amount;
                gameText.status.setText(`Moved ${amount} armies to ${name}`);
                endPlayerTurn();
            } else {
                gameText.status.setText("Invalid move amount!");
            }
        } else if (selected.neighbors.includes(name)) {
            // Attack
            battle(selected, t);
            endPlayerTurn();
        }
        selectedTerritory = null;
    }
}

function battle(attacker, defender) {
    // Simple combat: Compare army strengths with randomness
    let attackRoll = Math.floor(Math.random() * attacker.army) + attacker.army * 0.5;
    let defendRoll = Math.floor(Math.random() * defender.army) + defender.army * 0.5;
    if (attackRoll > defendRoll) {
        defender.army = Math.max(0, defender.army - Math.floor(attackRoll / 2));
        if (defender.army === 0) {
            defender.owner = attacker.owner;
            defender.army = Math.floor(attacker.army / 2);
            attacker.army = Math.floor(attacker.army / 2);
            defender.sprite.setTexture(attacker.owner === "Player" ? 'castle_player' : 'castle_enemy');
            gameText.status.setText(`${attacker.owner} conquered ${Object.keys(territories).find(k => territories[k] === defender)}!`);
        } else {
            gameText.status.setText(`Attack weakened ${Object.keys(territories).find(k => territories[k] === defender)}!`);
        }
    } else {
        attacker.army = Math.max(0, attacker.army - Math.floor(defendRoll / 2));
        gameText.status.setText(`${attacker.owner}'s attack failed!`);
    }
}

function recruitSoldiers() {
    if (turn === "Player" && selectedTerritory && playerGold >= 20) {
        territories[selectedTerritory].army += 10;
        playerGold -= 20;
        gameText.status.setText(`Recruited 10 soldiers in ${selectedTerritory}`);
    } else {
        gameText.status.setText("Not enough gold or no territory selected!");
    }
}

function enemyTurn() {
    enemyGold += Object.values(territories)
        .filter(t => t.owner === "Enemy")
        .reduce((sum, t) => sum + t.goldIncome, 0);

    let enemyTerritories = Object.keys(territories).filter(t => territories[t].owner === "Enemy");
    if (enemyTerritories.length) {
        // Recruit in a random territory
        if (enemyGold >= 20) {
            let t = territories[enemyTerritories[Math.floor(Math.random() * enemyTerritories.length)]];
            t.army += 10;
            enemyGold -= 20;
            gameText.status.setText(`Enemy recruited in ${Object.keys(territories).find(k => territories[k] === t)}`);
        }
        // Attack a neighbor if strong enough
        enemyTerritories.forEach(name => {
            let t = territories[name];
            if (t.army > 30) {
                let neighbors = t.neighbors.filter(n => territories[n].owner !== "Enemy");
                if (neighbors.length) {
                    let target = territories[neighbors[Math.floor(Math.random() * neighbors.length)]];
                    battle(t, target);
                }
            }
        });
    }
}

function endPlayerTurn() {
    turn = "Enemy";
    playerGold += Object.values(territories)
        .filter(t => t.owner === "Player")
        .reduce((sum, t) => sum + t.goldIncome, 0);
}