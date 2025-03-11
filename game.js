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

const game = new Phaser.Game(config);

let territories, selectedTerritory, playerGold = 100, enemyGold = 80, turn = "Player", instructions;

function preload() {
    // Load sprite assets (replace with your own or free ones from OpenGameArt.org)
    this.load.image('castle_player', 'https://opengameart.org/sites/default/files/castle_blue.png');
    this.load.image('castle_enemy', 'https://opengameart.org/sites/default/files/castle_red.png');
    this.load.image('castle_neutral', 'https://opengameart.org/sites/default/files/castle_gray.png');
}

function create() {
    // Territory data (name, position, owner, army)
    territories = {
        "Northland": { x: 200, y: 100, owner: "Player", army: 50, sprite: null },
        "Southland": { x: 200, y: 400, owner: "Enemy", army: 30, sprite: null },
        "Eastland": { x: 500, y: 250, owner: "Enemy", army: 40, sprite: null },
        "Westland": { x: 100, y: 250, owner: "Neutral", army: 20, sprite: null }
    };

    // Create territory sprites
    for (let name in territories) {
        let t = territories[name];
        let spriteKey = t.owner === "Player" ? 'castle_player' : t.owner === "Enemy" ? 'castle_enemy' : 'castle_neutral';
        t.sprite = this.add.sprite(t.x, t.y, spriteKey).setScale(0.5).setInteractive();
        t.sprite.on('pointerdown', () => handleClick(name));
        this.add.text(t.x - 20, t.y - 40, name.slice(0, 3), { fontSize: '16px', color: '#fff' });
        this.add.text(t.x - 20, t.y + 30, `Army: ${t.army}`, { fontSize: '14px', color: '#fff' });
    }

    // UI
    this.add.text(10, 10, `Gold: ${playerGold}`, { fontSize: '20px', color: '#fff' });
    this.add.text(10, 40, `Turn: ${turn}`, { fontSize: '20px', color: '#fff' });

    // Instructions
    instructions = this.add.text(200, 200, 
        "Crown Conquest Online\n" +
        "Objective: Conquer all territories.\n" +
        "1. Click a blue castle to select it.\n" +
        "2. Click a nearby castle to attack.\n" +
        "3. Win with higher army (random factor).\n" +
        "4. Earn 10 gold/turn; press 'R' for +10 soldiers (20 gold).\n" +
        "5. Press 'I' to toggle this text.\n" +
        "Start playing!", 
        { fontSize: '20px', color: '#fff', align: 'center' }
    ).setOrigin(0.5);
    instructions.setVisible(true);

    // Keyboard input
    this.input.keyboard.on('keydown-I', () => instructions.setVisible(!instructions.visible));
    this.input.keyboard.on('keydown-R', () => recruitSoldiers());
}

function update() {
    // Update UI
    this.children.list.forEach(child => {
        if (child.text && child.text.startsWith('Gold')) child.setText(`Gold: ${playerGold}`);
        if (child.text && child.text.startsWith('Turn')) child.setText(`Turn: ${turn}`);
        for (let name in territories) {
            if (child.text === `Army: ${territories[name].army}`) child.setText(`Army: ${territories[name].army}`);
        }
    });

    if (turn === "Enemy") {
        enemyTurn();
        turn = "Player";
        playerGold += 10;
    }
}

function handleClick(name) {
    if (instructions.visible) {
        instructions.setVisible(false);
        return;
    }
    if (turn !== "Player") return;

    let t = territories[name];
    if (!selectedTerritory && t.owner === "Player") {
        selectedTerritory = name;
        t.sprite.setTint(0xffff00); // Highlight selected
    } else if (selectedTerritory && name !== selectedTerritory && isAdjacent(territories[selectedTerritory], t)) {
        battle(territories[selectedTerritory], t);
        territories[selectedTerritory].sprite.clearTint();
        selectedTerritory = null;
        turn = "Enemy";
    }
}

function isAdjacent(t1, t2) {
    let dx = t1.x - t2.x, dy = t1.y - t2.y;
    return Math.sqrt(dx * dx + dy * dy) < 200;
}

function battle(attacker, defender) {
    let attackRoll = Math.floor(Math.random() * attacker.army);
    let defendRoll = Math.floor(Math.random() * defender.army);
    if (attackRoll > defendRoll) {
        defender.army = Math.max(0, defender.army - attackRoll);
        if (defender.army === 0) {
            defender.owner = attacker.owner;
            defender.army = Math.floor(attacker.army / 2);
            attacker.army = Math.floor(attacker.army / 2);
            defender.sprite.setTexture(attacker.owner === "Player" ? 'castle_player' : 'castle_enemy');
        }
    } else {
        attacker.army = Math.max(0, attacker.army - defendRoll);
    }
}

function recruitSoldiers() {
    if (turn === "Player" && selectedTerritory && playerGold >= 20) {
        territories[selectedTerritory].army += 10;
        playerGold -= 20;
    }
}

function enemyTurn() {
    enemyGold += 10;
    let enemyTerritories = Object.keys(territories).filter(t => territories[t].owner === "Enemy");
    if (enemyTerritories.length && enemyGold >= 20) {
        let t = territories[enemyTerritories[Math.floor(Math.random() * enemyTerritories.length)]];
        t.army += 10;
        enemyGold -= 20;
    }
}