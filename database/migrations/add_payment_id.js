const { db } = require('../init');

// Adicionar coluna payment_id na tabela agendamentos
db.run(`
    ALTER TABLE agendamentos 
    ADD COLUMN payment_id TEXT
`, (err) => {
    if (err) {
        // Se a coluna já existe, ignorar o erro
        if (err.message.includes('duplicate column')) {
            console.log('✅ Coluna payment_id já existe');
        } else {
            console.error('Erro ao adicionar coluna payment_id:', err);
        }
    } else {
        console.log('✅ Coluna payment_id adicionada com sucesso');
    }
    
    db.close();
});

