const express = require('express');
const path = require('path');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const { Pool } = require('pg');
const { sendNotificationEmail } = require('./emailSender');
require("dotenv/config");

const app = express();
const port = process.env.PORT || 4000;

// Configuração da sessão com variável de ambiente
const secretKey = process.env.SESSION_SECRET || 'sua_chave_secreta_aqui';
app.use(session({
    secret: secretKey,
    resave: false,
    saveUninitialized: false
}));

// Middleware para tratar JSON e URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Configuração do diretório de arquivos estáticos (CSS, imagens, HTML, etc.)
app.use(express.static(path.join(__dirname, 'public')));

// Configuração do banco de dados
let db;
if (process.env.NODE_ENV === 'production') {
    // Configuração para PostgreSQL em ambiente de produção
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL, // Use a variável de ambiente para a URL de conexão
        ssl: {
            rejectUnauthorized: false
        }
    });

    db = {
        run: (sql, params, callback) => pool.query(sql, params, (err, result) => callback(err, result)),
        get: (sql, params, callback) => pool.query(sql, params, (err, result) => callback(err, result.rows[0])),
        all: (sql, params, callback) => pool.query(sql, params, (err, result) => callback(err, result.rows))
    };
} else {
    // Configuração para SQLite em ambiente de desenvolvimento/local
    const sqlite3 = require('sqlite3').verbose();
    db = new sqlite3.Database('database.sqlite', (err) => {
        if (err) {
            console.error('Erro ao conectar ao banco de dados SQLite:', err.message);
        } else {
            console.log('Conexão com o banco de dados SQLite estabelecida.');
        }
    });
}

// Middleware para verificar autenticação e autorização
function authenticateAndAuthorize(req, res, next) {
    if (req.isAuthenticated()) {
        if (req.user && req.user.role === 'admin') {
            return next();
        } else {
            return res.status(403).send('Acesso proibido. Você não tem permissão para acessar esta rota.');
        }
    } else {
        return res.status(401).send('Acesso não autorizado. Faça login para acessar esta rota.');
    }
}

// Rota para salvar um produto (sem autenticação)
app.post('/salvar_produto', (req, res) => {
    const {
        codigo,
        descricao,
        desc_resumida,
        valor_unitario,
        unidade,
        kit,
        consignado,
        opme,
        especie,
        classe,
        sub_classe,
        curva_abc,
        lote,
        serie,
        registro_anvisa,
        etiqueta,
        medicamento,
        med_controla,
        validade,
        armazenamento_ar_cond,
        armazenamento_geladeira,
        padronizado,
        aplicacao,
        auto_custo,
        valor,
        repasse,
        procedimento_faturamento,
        tipo_atendimento_ps,
        tipo_atendimento_ambulatorio,
        tipo_atendimento_internacao,
        tipo_atendimento_externo,
        tipo_atendimento_todos,
        observacao
    } = req.body;

    const token = uuidv4();
    const produtoData = {
        codigo,
        descricao,
        desc_resumida,
        valor_unitario,
        unidade,
        kit,
        consignado,
        opme,
        especie,
        classe,
        sub_classe,
        curva_abc,
        lote,
        serie,
        registro_anvisa,
        etiqueta,
        medicamento,
        med_controla,
        validade,
        armazenamento_ar_cond: armazenamento_ar_cond === 'S' ? 'S' : null,
        armazenamento_geladeira: armazenamento_geladeira === 'S' ? 'S' : null,
        padronizado,
        aplicacao,
        auto_custo,
        valor,
        repasse,
        procedimento_faturamento,
        tipo_atendimento_ps: tipo_atendimento_ps === 'S' ? 'S' : null,
        tipo_atendimento_ambulatorio: tipo_atendimento_ambulatorio === 'S' ? 'S' : null,
        tipo_atendimento_internacao: tipo_atendimento_internacao === 'S' ? 'S' : null,
        tipo_atendimento_externo: tipo_atendimento_externo === 'S' ? 'S' : null,
        tipo_atendimento_todos: tipo_atendimento_todos === 'S' ? 'S' : null,
        observacao,
        token
    };

    const sql = `
        INSERT INTO produtos (
            codigo,
            descricao,
            desc_resumida,
            valor_unitario,
            unidade,
            kit,
            consignado,
            opme,
            especie,
            classe,
            sub_classe,
            curva_abc,
            lote,
            serie,
            registro_anvisa,
            etiqueta,
            medicamento,
            med_controla,
            validade,
            armazenamento_ar_cond,
            armazenamento_geladeira,
            padronizado,
            aplicacao,
            auto_custo,
            valor,
            repasse,
            procedimento_faturamento,
            tipo_atendimento_ps,
            tipo_atendimento_ambulatorio,
            tipo_atendimento_internacao,
            tipo_atendimento_externo,
            tipo_atendimento_todos,
            observacao,
            token
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
        produtoData.codigo,
        produtoData.descricao,
        produtoData.desc_resumida,
        produtoData.valor_unitario,
        produtoData.unidade,
        produtoData.kit,
        produtoData.consignado,
        produtoData.opme,
        produtoData.especie,
        produtoData.classe,
        produtoData.sub_classe,
        produtoData.curva_abc,
        produtoData.lote,
        produtoData.serie,
        produtoData.registro_anvisa,
        produtoData.etiqueta,
        produtoData.medicamento,
        produtoData.med_controla,
        produtoData.validade,
        produtoData.armazenamento_ar_cond,
        produtoData.armazenamento_geladeira,
        produtoData.padronizado,
        produtoData.aplicacao,
        produtoData.auto_custo,
        produtoData.valor,
        produtoData.repasse,
        produtoData.procedimento_faturamento,
        produtoData.tipo_atendimento_ps,
        produtoData.tipo_atendimento_ambulatorio,
        produtoData.tipo_atendimento_internacao,
        produtoData.tipo_atendimento_externo,
        produtoData.tipo_atendimento_todos,
        produtoData.observacao,
        produtoData.token
    ];

    db.run(sql, params, function(err) {
        if (err) {
            console.error('Erro ao cadastrar produto:', err);
            return res.json({ status: 'erro', mensagem: 'Erro ao cadastrar produto' });
        }
    
        const continuationLink = `http://localhost:3000/continuar_cadastro?token=${token}&codigo=${codigo}&descricao=${descricao}&desc_resumida=${desc_resumida}&observacao=${observacao}`;
        const mailOptions = {
            from: 'weslley.filadelfo@veros.vet',
            to: 'weslley.filadelfo@veros.vet',
            subject: 'Continuar Cadastro de Produto Pendente',
            text: `Há um cadastro de produto pendente. Clique no link a seguir para continuar o cadastro:\n${continuationLink}`
        };
    
        sendNotificationEmail(mailOptions);
        res.json({ status: 'sucesso' });
    });
});

app.get('/continuar_cadastro', (req, res) => {
    const { token } = req.query;

    const selectProductSql = `
        SELECT *
        FROM produtos
        WHERE token = ?
    `;

    db.get(selectProductSql, [token], (err, row) => {
        if (err) {
            console.error('Erro ao buscar produto pendente:', err);
            return res.status(500).send('Erro ao buscar produto pendente');
        }

        if (!row) {
            console.error('Produto pendente não encontrado para o token fornecido:', token);
            return res.status(404).send('Produto pendente não encontrado');
        }

        const produto = {
            ...row,
            tipo_atendimento: {
                ps: row.tipo_atendimento_ps === 1 ? 'S' : 'N',
                ambulatorio: row.tipo_atendimento_ambulatorio === 1 ? 'S' : 'N',
                internacao: row.tipo_atendimento_internacao === 1 ? 'S' : 'N',
                externo: row.tipo_atendimento_externo === 1 ? 'S' : 'N',
                todos: row.tipo_atendimento_todos === 1 ? 'S' : 'N'
            }
        };

        res.render('continuar_cadastro', { produto });
    });
});

app.post('/finalizar_cadastro_produto', (req, res) => {
    const {
        token,
        codigo,
        descricao,
        desc_resumida,
        valor_unitario,
        unidade,
        kit,
        consignado,
        opme,
        especie,
        classe,
        sub_classe,
        curva_abc,
        lote,
        serie,
        registro_anvisa,
        etiqueta,
        medicamento,
        med_controla,
        validade,
        armazenamento_ar_cond,
        armazenamento_geladeira,
        padronizado,
        aplicacao,
        auto_custo,
        valor,
        repasse,
        procedimento_faturamento,
        tipo_atendimento_ps,
        tipo_atendimento_ambulatorio,
        tipo_atendimento_internacao,
        tipo_atendimento_externo,
        tipo_atendimento_todos,
        observacao
    } = req.body;

    if (!token) {
        console.error('Erro: Token não fornecido');
        return res.status(400).send('Token não fornecido');
    }

    if (!codigo || !descricao || !desc_resumida) {
        console.error('Erro: Dados obrigatórios ausentes ou inválidos');
        return res.status(400).send('Dados obrigatórios ausentes ou inválidos');
    }

    const updateProductSql = `
        UPDATE produtos
        SET
            codigo = ?,
            descricao = ?,
            desc_resumida = ?,
            valor_unitario = ?,
            unidade = ?,
            kit = ?,
            consignado = ?,
            opme = ?,
            especie = ?,
            classe = ?,
            sub_classe = ?,
            curva_abc = ?,
            lote = ?,
            serie = ?,
            registro_anvisa = ?,
            etiqueta = ?,
            medicamento = ?,
            med_controla = ?,
            validade = ?,
            armazenamento_ar_cond = ?,
            armazenamento_geladeira = ?,
            padronizado = ?,
            aplicacao = ?,
            auto_custo = ?,
            valor = ?,
            repasse = ?,
            procedimento_faturamento = ?,
            tipo_atendimento_ps = ?,
            tipo_atendimento_ambulatorio = ?,
            tipo_atendimento_internacao = ?,
            tipo_atendimento_externo = ?,
            tipo_atendimento_todos = ?,
            observacao = ?
        WHERE token = ?
    `;

    const tipo_atendimento = {
        ps: req.body.tipo_atendimento_ps === 'S' ? 1 : 0,
        ambulatorio: req.body.tipo_atendimento_ambulatorio === 'S' ? 1 : 0,
        internacao: req.body.tipo_atendimento_internacao === 'S' ? 1 : 0,
        externo: req.body.tipo_atendimento_externo === 'S' ? 1 : 0,
        todos: req.body.tipo_atendimento_todos === 'S' ? 1 : 0
    };

    const params = [
        codigo,
        descricao,
        desc_resumida,
        valor_unitario,
        unidade,
        kit,
        consignado,
        opme,
        especie,
        classe,
        sub_classe,
        curva_abc,
        lote,
        serie,
        registro_anvisa,
        etiqueta,
        medicamento,
        med_controla,
        validade,
        armazenamento_ar_cond === 'S' ? 1 : 0,
        armazenamento_geladeira === 'S' ? 1 : 0,
        padronizado,
        aplicacao,
        auto_custo,
        valor,
        repasse,
        procedimento_faturamento,
        tipo_atendimento.ps,
        tipo_atendimento.ambulatorio,
        tipo_atendimento.internacao,
        tipo_atendimento.externo,
        tipo_atendimento.todos,
        observacao,
        token
    ];

    db.run(updateProductSql, params, function(err) {
        if (err) {
            console.error('Erro ao atualizar produto:', err);
            return res.status(500).json({ status: 'erro', mensagem: 'Erro ao atualizar produto' });
        }

        const userEmail = 'cadastro_pet@outlook.com';
        const mailOptions = {
            from: 'cadastro_pet@outlook.com',
            to: userEmail,
            subject: 'Produto cadastrado no sistema MV',
            text: `O produto com código ${codigo} e descrição ${descricao} foi cadastrado no sistema MV com sucesso. Observação: ${observacao}.`
        };

        sendNotificationEmail(mailOptions);
        res.json({ status: 'sucesso' });
    });
});

// Rota para obter todos os setores cadastrados
app.get('/get_setores', (req, res) => {
    db.all('SELECT * FROM setores', (err, rows) => {
        if (err) {
            console.error('Erro ao obter setores:', err);
            return res.status(500).send('Erro ao obter setores');
        }
        res.status(200).json(rows);
    });
});

// Rota para processar o formulário de login
app.post('/index', (req, res) => {
    const { username, email } = req.body;

    db.get('SELECT * FROM users WHERE username = ? OR email = ?', [username, email], (err, row) => {
        if (err) {
            console.error('Erro ao autenticar usuário:', err);
            return res.status(500).send('Erro ao autenticar usuário');
        }
        if (!row) {
            console.log('Usuário não encontrado');
            return res.status(401).send('Usuário não encontrado');
        }

        req.session.authenticated = true;
        req.session.username = username;
        req.session.email = row.email;

        if (username === 'farmacia.veros' && row.email === 'farmacia.pet@outlook.com') {
            res.redirect('/menu');
        } else if (username === 'weslley.filadelfo' && row.email === 'weslleyafiladelfo@gmail.com') {
            res.redirect('/menu');
        } else {
            res.status(401).send('Credenciais inválidas');
        }
    });
});

// Rota para tela de usuário padrão
app.get('/tela_usuario_padrao', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'tela_usuario_padrao.html'));
});

// Rota para a página de menu
app.get('/menu', isAuthenticated, (req, res) => {
    const username = req.session.username;

    if (username === 'weslley.filadelfo') {
        res.render('menu', { showAllButtons: true });
    } else if (username === 'farmacia.veros') {
        res.render('menu', { showAllButtons: false });
    } else {
        res.status(401).send('Acesso não autorizado');
    }
});

// Middleware para verificar autenticação
function isAuthenticated(req, res, next) {
    if (req.session.authenticated) {
        next();
    } else {
        res.redirect('/');
    }
}

// Rota para processar o formulário de cadastro de usuário
app.post('/salvar_usuario', (req, res) => {
    const { name, email, username, setor_id } = req.body;

    if (!name || !email || !username || !setor_id) {
        return res.status(400).send('Todos os campos devem ser preenchidos.');
    }

    const sql = 'INSERT INTO users (name, email, username, setor_id) VALUES (?, ?, ?, ?)';
    db.run(sql, [name, email, username, setor_id], function(err) {
        if (err) {
            console.error('Erro ao cadastrar usuário:', err);
            return res.status(500).send('Erro ao cadastrar usuário');
        }
        res.status(200).json({ message: 'Usuário cadastrado com sucesso!' });
    });
});

// Executar a criação da tabela solicitacoes apenas se estivermos no ambiente de desenvolvimento/local
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS solicitacoes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            usuario TEXT,
            descricao TEXT,
            data_solicitacao DATETIME DEFAULT CURRENT_TIMESTAMP,
            status TEXT DEFAULT 'Pendente'
        )
    `, (err) => {
        if (err) {
            console.error('Erro ao criar tabela de solicitações:', err.message);
        } else {
            console.log('Tabela de solicitações criada com sucesso.');
        }
    });
});

// Exportar o objeto de banco de dados para uso em outros lugares do aplicativo
module.exports = db;

app.post('/solicitar_cadastro_produto', (req, res) => {
    const { usuario, descricao } = req.body;

    const sql = `
        INSERT INTO solicitacoes (usuario, descricao)
        VALUES (?, ?)
    `;

    db.run(sql, [usuario, descricao], (err) => {
        if (err) {
            console.error('Erro ao salvar solicitação no banco de dados:', err.message);
            res.status(500).send('Erro ao salvar solicitação no banco de dados.');
        } else {
            console.log('Solicitação de cadastro de produto salva com sucesso.');
            res.status(200).send('Solicitação de cadastro de produto salva com sucesso.');
        }
    });
});

app.get('/listar_solicitacoes', (req, res) => {
    const sql = `
        SELECT * FROM solicitacoes
    `;

    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error('Erro ao listar solicitações:', err.message);
            res.status(500).send('Erro ao listar solicitações.');
        } else {
            res.status(200).json(rows);
        }
    });
});

app.post('/salvar_setor', (req, res) => {
    const { nome, responsavel } = req.body;

    if (!nome) {
        return res.status(400).send('O nome do setor é obrigatório.');
    }

    const sql = 'INSERT INTO setores (nome, responsavel) VALUES (?, ?)';
    db.run(sql, [nome, responsavel], function(err) {
        if (err) {
            console.error('Erro ao cadastrar setor:', err);
            return res.status(500).send('Erro ao cadastrar setor');
        }
        res.status(200).send('Setor cadastrado com sucesso!');
    });
});

app.get('/cadastroSetor.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.sendFile(path.join(__dirname, 'cadastroSetor.js'));
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/menu', (req, res) => {
    res.sendFile(path.join(__dirname, 'menu.html'));
});

app.get('/usuario.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'usuario.html'));
});

app.get('/setor.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'setor.html'));
});

app.get('/alterarUsuario.html', (req, res) => {
    db.all('SELECT * FROM users', (err, rows) => {
        if (err) {
            console.error('Erro ao buscar usuários:', err);
            res.status(500).send('Erro ao buscar usuários');
        } else {
            res.sendFile(path.join(__dirname, 'alterarUsuario.html'));
        }
    });
});

app.get('/cadastro_produto', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'cadastro_produto.html'));
});

app.get('/procedimento.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'procedimento.html'));
});

app.get('/historico_solicitacoes.html', (req, res) => {
    let db = new sqlite3.Database('database.sqlite');

    db.all('SELECT * FROM produtos', (err, rows) => {
        if (err) {
            console.error(err.message);
            res.status(500).send('Erro ao recuperar os dados do banco de dados');
            return;
        }

        res.render('historico_solicitacoes', { solicitudes: rows });
    });

    db.close();
});

app.use((err, req, res, next) => {
    console.error('Erro no servidor:', err);
    res.status(500).send('Erro interno no servidor');
});

app.listen(port, () => {
    console.log(`Servidor rodando em ${port}`);
});

process.on('exit', () => {
    if (process.env.NODE_ENV !== 'production') {
        db.close((err) => {
            if (err) {
                console.error('Erro ao fechar conexão com o banco de dados:', err.message);
            } else {
                console.log('Conexão com o banco de dados fechada.');
            }
        });
    }
});
