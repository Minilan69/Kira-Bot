const Database = require("better-sqlite3");
const db = new Database("db/data.db", { verbose: console.log });

// Tables Initialisation
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    apple INTEGER DEFAULT 0,
    kill_streak INTEGER DEFAULT 0,
    is_dead INTEGER DEFAULT 0,
    timestamp INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS death_note (
    user_id TEXT,
    victim_id TEXT,
    number INTEGER DEFAULT 0,
    cause TEXT,
    time INTEGER DEFAULT 0,
    is_kill INTEGER DEFAULT 0,
    PRIMARY KEY (user_id, number),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (victim_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

// Create User
function UserAdd(id) {
  const userStmt = db.prepare(`
  INSERT OR IGNORE INTO users (id, apple, kill_streak, is_dead, timestamp)
  VALUES (?, 0, 0, 0, 0);`);
  userStmt.run(id);
}

const dbUtils = {
  // Add An User
  addUser: (id) => {
    UserAdd(id);
  },

  // Get An User
  getUser: (id) => {
    UserAdd(id);
    const userStmt = db.prepare(`
      SELECT u.id, u.apple, u.kill_streak, u.is_dead, u.timestamp

      FROM users u
      WHERE u.id = ?
    `);
    const user = userStmt.get(id);

    if (!user) return null;

    const death_noteStmt = db.prepare(`
      SELECT victim_id, number, cause, time, is_kill FROM death_note WHERE user_id = ?
    `);
    const death_note = death_noteStmt.all(id);

    user.death_note = {};
    death_note.forEach(({ number, victim_id, cause, time, is_kill }) => {
      user.death_note[number] = [victim_id, cause, time, is_kill];
    });

    return user;
  },

  // Apple Update
  updateApple: (id, amount) => {
    UserAdd(id);
    const userStmt = db.prepare("SELECT apple FROM users WHERE id = ?");
    const user = userStmt.get(id);

    const newApple = user.apple + amount;
    const updateStmt = db.prepare("UPDATE users SET apple = ? WHERE id = ?");
    updateStmt.run(newApple, id);
  },

  // Kill_Streak Update
  updateKill_Streak: (id, amount) => {
    UserAdd(id);
    const updateStmt = db.prepare(
      "UPDATE users SET kill_streak = ? WHERE id = ?"
    );
    updateStmt.run(amount, id);
  },

  // Timestamp Update
  updateTimestamp: (id, timestamp) => {
    UserAdd(id);
    const updateStmt = db.prepare(
      "UPDATE users SET timestamp = ? WHERE id = ?"
    );
    updateStmt.run(timestamp, id);
  },

  // Is_Dead Update
  updateIs_Dead: (id, is_dead) => {
    UserAdd(id);
    const updateStmt = db.prepare("UPDATE users SET is_dead = ? WHERE id = ?");
    updateStmt.run(is_dead, id);
  },

  // Is_Kill Update
  updateIs_Kill: (id, number, is_kill) => {
    UserAdd(id);
    const updateStmt = db.prepare(`
      UPDATE death_note 
      SET is_kill = ? 
      WHERE user_id = ? AND number = ?
    `);
    updateStmt.run(is_kill, id, number);
  },

  // Add Line In Death_Note
  addDeath_Note: (user_id, victim_id, cause, time) => {
    UserAdd(user_id);
    UserAdd(victim_id);

    // Récupérer le dernier numéro pour cet utilisateur
    const getLastNumberStmt = db.prepare(`
      SELECT COALESCE(MAX(number), 0) AS last_number FROM death_note WHERE user_id = ?
    `);
    const { last_number } = getLastNumberStmt.get(user_id);

    const new_number = last_number + 1;

    // Insérer la nouvelle entrée avec le numéro incrémenté
    const addDeath_NoteStmt = db.prepare(`
      INSERT INTO death_note (user_id, victim_id, number, cause, time, is_kill)
      VALUES (?, ?, ?, ?, ?, 0)
    `);
    addDeath_NoteStmt.run(user_id, victim_id, new_number, cause, time);
    return new_number;
  },

  // Top
  getTopUsers: (limit) => {
    const stmt = db.prepare(`
      SELECT id, apple FROM users ORDER BY balance DESC LIMIT ?
    `);
    return stmt.all(limit);
  },

  // Delete User
  deleteUser: (id) => {
    UserAdd(id);
    const deleteUserStmt = db.prepare(`
      DELETE FROM users WHERE id = ?
    `);
    deleteUserStmt.run(id);

    const deleteDeath_NoteStmt = db.prepare(`
      DELETE FROM death_note WHERE user_id = ?
    `);
    deleteDeath_NoteStmt.run(id);
  },
};

module.exports = dbUtils;
