const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

// Caminho do banco de dados (suporta variável de ambiente para deploy)
const dbPath = process.env.DB_PATH || path.join(__dirname, 'barbearia.db');

// Conectar ao banco de dados
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados:', err.message);
    } else {
        console.log('Conectado ao banco de dados SQLite');
    }
});

// Criar tabelas
const createTables = () => {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            // Tabela de usuários (barbeiros e clientes)
            db.run(`
                CREATE TABLE IF NOT EXISTS usuarios (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    nome TEXT NOT NULL,
                    email TEXT UNIQUE NOT NULL,
                    senha TEXT NOT NULL,
                    telefone TEXT,
                    tipo TEXT NOT NULL CHECK(tipo IN ('barbeiro', 'cliente', 'admin')),
                    ativo BOOLEAN DEFAULT 1,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // Tabela de serviços
            db.run(`
                CREATE TABLE IF NOT EXISTS servicos (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    nome TEXT NOT NULL,
                    descricao TEXT,
                    preco DECIMAL(10,2) NOT NULL,
                    duracao_minutos INTEGER NOT NULL,
                    ativo BOOLEAN DEFAULT 1,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // Tabela de agendamentos
            db.run(`
                CREATE TABLE IF NOT EXISTS agendamentos (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    cliente_id INTEGER NOT NULL,
                    barbeiro_id INTEGER NOT NULL,
                    servico_id INTEGER NOT NULL,
                    data_agendamento DATE NOT NULL,
                    hora_agendamento TIME NOT NULL,
                    status TEXT DEFAULT 'pendente' CHECK(status IN ('pendente', 'confirmado', 'cancelado', 'concluido')),
                    observacoes TEXT,
                    payment_id TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (cliente_id) REFERENCES usuarios (id),
                    FOREIGN KEY (barbeiro_id) REFERENCES usuarios (id),
                    FOREIGN KEY (servico_id) REFERENCES servicos (id)
                )
            `);
            
            // Adicionar coluna payment_id se não existir (para bancos existentes)
            db.run(`ALTER TABLE agendamentos ADD COLUMN payment_id TEXT`, (err) => {
                // Ignorar erro se a coluna já existir
                if (err && !err.message.includes('duplicate column')) {
                    // Coluna já existe ou outro erro não crítico
                }
            });

            // Tabela de horários de funcionamento
            db.run(`
                CREATE TABLE IF NOT EXISTS horarios_funcionamento (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    barbeiro_id INTEGER NOT NULL,
                    dia_semana INTEGER NOT NULL CHECK(dia_semana BETWEEN 0 AND 6),
                    hora_inicio TIME NOT NULL,
                    hora_fim TIME NOT NULL,
                    ativo BOOLEAN DEFAULT 1,
                    FOREIGN KEY (barbeiro_id) REFERENCES usuarios (id)
                )
            `);

            // Tabela de disponibilidade (horários específicos)
            db.run(`
                CREATE TABLE IF NOT EXISTS disponibilidade (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    barbeiro_id INTEGER NOT NULL,
                    data DATE NOT NULL,
                    hora TIME NOT NULL,
                    disponivel BOOLEAN DEFAULT 1,
                    FOREIGN KEY (barbeiro_id) REFERENCES usuarios (id)
                )
            `);

            // Não precisamos de COMMIT explícito no SQLite
            resolve();
        });
    });
};

// Inserir dados iniciais
const insertInitialData = async () => {
    try {
        // Hash da senha padrão
        const hashedPassword = await bcrypt.hash('123456', 10);

        // Inserir usuários iniciais
        const usuarios = [
            {
                nome: 'Administrador',
                email: 'admin@barbearia.com',
                senha: hashedPassword,
                telefone: '(11) 99999-0000',
                tipo: 'admin'
            },
            {
                nome: 'João Silva',
                email: 'joao@barbearia.com',
                senha: hashedPassword,
                telefone: '(11) 99999-1111',
                tipo: 'barbeiro'
            },
            {
                nome: 'Pedro Santos',
                email: 'pedro@barbearia.com',
                senha: hashedPassword,
                telefone: '(11) 99999-2222',
                tipo: 'barbeiro'
            },
            {
                nome: 'Carlos Oliveira',
                email: 'carlos@barbearia.com',
                senha: hashedPassword,
                telefone: '(11) 99999-3333',
                tipo: 'barbeiro'
            },
        ];

        for (const usuario of usuarios) {
            await new Promise((resolve, reject) => {
                db.run(
                    `INSERT OR IGNORE INTO usuarios (nome, email, senha, telefone, tipo) 
                     VALUES (?, ?, ?, ?, ?)`,
                    [usuario.nome, usuario.email, usuario.senha, usuario.telefone, usuario.tipo],
                    function(err) {
                        if (err) reject(err);
                        else resolve();
                    }
                );
            });
        }

        // Inserir serviços
        const servicos = [
            {
                nome: 'Corte de Cabelo',
                descricao: 'Corte moderno e estiloso',
                preco: 30.00,
                duracao_minutos: 30
            },
            {
                nome: 'Barba',
                descricao: 'Aparar e modelar a barba',
                preco: 20.00,
                duracao_minutos: 30
            },
            {
                nome: 'Combo',
                descricao: 'Corte + Barba',
                preco: 50.00,
                duracao_minutos: 60
            },
            {
                nome: 'Sobrancelha',
                descricao: 'Design e limpeza da sobrancelha',
                preco: 20.00,
                duracao_minutos: 15
            }
        ];

        for (const servico of servicos) {
            await new Promise((resolve, reject) => {
                db.run(
                    `INSERT OR IGNORE INTO servicos (nome, descricao, preco, duracao_minutos) 
                     VALUES (?, ?, ?, ?)`,
                    [servico.nome, servico.descricao, servico.preco, servico.duracao_minutos],
                    function(err) {
                        if (err) reject(err);
                        else resolve();
                    }
                );
            });
        }

        // Inserir horários de funcionamento (segunda a sexta, 8h às 18h)
        const barbeiros = await new Promise((resolve, reject) => {
            db.all("SELECT id FROM usuarios WHERE tipo = 'barbeiro'", (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });

        for (const barbeiro of barbeiros) {
            for (let dia = 1; dia <= 5; dia++) { // Segunda a sexta
                await new Promise((resolve, reject) => {
                    db.run(
                        `INSERT OR IGNORE INTO horarios_funcionamento (barbeiro_id, dia_semana, hora_inicio, hora_fim) 
                         VALUES (?, ?, ?, ?)`,
                        [barbeiro.id, dia, '08:00', '18:00'],
                        function(err) {
                            if (err) reject(err);
                            else resolve();
                        }
                    );
                });
            }
        }

        console.log('Dados iniciais inseridos com sucesso!');
    } catch (error) {
        console.error('Erro ao inserir dados iniciais:', error);
    }
};

// Inicializar banco de dados
const initDatabase = async () => {
    try {
        await createTables();
        await insertInitialData();
        console.log('Banco de dados inicializado com sucesso!');
    } catch (error) {
        console.error('Erro ao inicializar banco de dados:', error);
    }
};

module.exports = { db, initDatabase };

