const express = require('express');
const path = require('path');
const session = require('express-session');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const sqlite3 = require('sqlite3').verbose();
const { sendNotificationEmail } = require('./emailSender');
const { name } = require('ejs');
const LocalStrategy = require('passport-local').Strategy;
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

// Configuração do banco de dados SQLite
const db = new sqlite3.Database('database.sqlite', (err) => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados:', err.message);
    } else {
        console.log('Conexão com o banco de dados estabelecida.');
    }
});

// Middleware para verificar autenticação e autorização
function authenticateAndAuthorize(req, res, next) {
    // Verificar se o usuário está autenticado
    if (req.isAuthenticated()) {
        // Verificar se o usuário tem permissão adequada (por exemplo, admin)
        if (req.user && req.user.role === 'admin') {
            // Usuário autenticado e autorizado
            return next();
        } else {
            // Usuário não autorizado (não é admin)
            return res.status(403).send('Acesso proibido. Você não tem permissão para acessar esta rota.');
        }
    } else {
        // Usuário não autenticado
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

    // Gerar um token único para o produto
    const token = uuidv4();

    // Preparar os dados do produto para inserção
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

    // Montar a consulta SQL com placeholders para os valores
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

    // Extrair os valores do objeto produtoData na ordem correta
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
    
        // Enviar e-mail de notificação com link para continuar o cadastro
        const continuationLink = `http://localhost:3000/continuar_cadastro?token=${token}&codigo=${codigo}&descricao=${descricao}&desc_resumida=${desc_resumida}&observacao=${observacao}`;
        const mailOptions = {
            from: 'weslley.filadelfo@veros.vet',
            to: 'weslley.filadelfo@veros.vet', // Altere para o e-mail do usuário
            subject: 'Continuar Cadastro de Produto Pendente',
            text: `Há um cadastro de produto pendente. Clique no link a seguir para continuar o cadastro:\n${continuationLink}`
        };
    
        // Enviar o e-mail de notificação
        sendNotificationEmail(mailOptions);
    
        // Responder com o status de sucesso
        res.json({ status: 'sucesso' });
    });
});

// Rota para continuar o cadastro com dados preenchidos
app.get('/continuar_cadastro', (req, res) => {
    // Lógica para buscar e renderizar os dados do produto pendente
    const { token } = req.query; // Usar req.query para obter o token da URL

    // Buscar o produto pendente associado ao token no banco de dados
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

        // Verificar se a propriedade 'tipo_atendimento' está definida antes de passá-la para o template
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

        // Renderizar a página 'continuar_cadastro.ejs' com os dados preenchidos
        res.render('continuar_cadastro', { produto });
    });
});


// Rota para finalizar o cadastro do produto
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
        observacao
    } = req.body;

    // Verificar se o token foi fornecido
    if (!token) {
        console.error('Erro: Token não fornecido');
        return res.status(400).send('Token não fornecido');
    }

    // Verificar se todos os dados necessários estão presentes e válidos
    if (!codigo || !descricao || !desc_resumida) {
        console.error('Erro: Dados obrigatórios ausentes ou inválidos');
        return res.status(400).send('Dados obrigatórios ausentes ou inválidos');
    }

    // Atualizar o produto no banco de dados com os novos dados
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

// Supondo que tipo_atendimento seja inicializado anteriormente
const tipo_atendimento = {
    ps: req.body.tipo_atendimento_ps === 'S' ? 1 : 0,
    ambulatorio: req.body.tipo_atendimento_ambulatorio === 'S' ? 1 : 0,
    internacao: req.body.tipo_atendimento_internacao === 'S' ? 1 : 0,
    externo: req.body.tipo_atendimento_externo === 'S' ? 1 : 0,
    todos: req.body.tipo_atendimento_todos === 'S' ? 1 : 0
};    

// Construir o array de parâmetros para a consulta SQL
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

// Executar a consulta SQL de atualização
db.run(updateProductSql, params, function(err) {
    if (err) {
        console.error('Erro ao atualizar produto:', err);
        return res.status(500).json({ status: 'erro', mensagem: 'Erro ao atualizar produto' });
    }

        // Enviar e-mail de notificação para quem iniciou o cadastro
        const userEmail = 'cadastro_pet@outlook.com'; // E-mail do destinatário
        const mailOptions = {
            from: 'cadastro_pet@outlook.com',
            to: userEmail,
            subject: 'Produto cadastrado no sistema MV',
            text: `O produto com código ${codigo} e descrição ${descricao} foi cadastrado no sistema MV com sucesso. Observação: ${observacao}.`
        };

        // Enviar o e-mail de notificação utilizando a função atualizada
        sendNotificationEmail(mailOptions);

        // Responder com o status de sucesso
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

    // Consultar o banco de dados para encontrar o usuário
    db.get('SELECT * FROM users WHERE username = ? OR email = ?', [username, email], (err, row) => {
        if (err) {
            console.error('Erro ao autenticar usuário:', err);
            return res.status(500).send('Erro ao autenticar usuário');
        }
        if (!row) {
            console.log('Usuário não encontrado');
            return res.status(401).send('Usuário não encontrado');
        }

        // Armazenar as informações de autenticação na sessão
        req.session.authenticated = true;
        req.session.username = username;
        req.session.email = row.email;

        // Redirecionar com base no usuário autenticado
        if (username === 'farmacia.veros' && row.email === 'farmacia.pet@outlook.com') {
            // Redirecionar para tela de usuário padrão
            res.redirect('/menu');
        } else if (username === 'weslley.filadelfo' && row.email === 'weslleyafiladelfo@gmail.com') {
            // Redirecionar para o menu geral
            res.redirect('/menu');
        } else {
            // Credenciais inválidas
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
        // Renderiza menu completo para o usuário weslley.filadelfo
        res.render('menu', { showAllButtons: true });
    } else if (username === 'farmacia.veros') {
        // Renderiza menu restrito para o usuário farmacia.veros
        res.render('menu', { showAllButtons: false });
    } else {
        // Usuário não autorizado
        res.status(401).send('Acesso não autorizado');
    }
});

// Middleware para verificar autenticação
function isAuthenticated(req, res, next) {
    if (req.session.authenticated) {
        // Se o usuário estiver autenticado, prossiga
        next();
    } else {
        // Se não estiver autenticado, redirecione para o login
        res.redirect('/');
    }
}

// Rota para processar o formulário de cadastro de usuário
app.post('/salvar_usuario', (req, res) => {
    const { name, email, username, setor_id } = req.body;

    // Verificar se todos os campos obrigatórios foram enviados
    if (!name || !email || !username || !setor_id) {
        return res.status(400).send('Todos os campos devem ser preenchidos.');
    }

    // Inserir novo usuário no banco de dados
    const sql = 'INSERT INTO users (name, email, username, setor_id) VALUES (?, ?, ?, ?)';
    db.run(sql, [name, email, username, setor_id], function(err) {
        if (err) {
            console.error('Erro ao cadastrar usuário:', err);
            return res.status(500).send('Erro ao cadastrar usuário');
        }
        res.status(200).json({ message: 'Usuário cadastrado com sucesso!' });
    });
});

// Criar a tabela de solicitações (caso não exista)
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

// Rota para processar solicitação de cadastro de produto
app.post('/solicitar_cadastro_produto', (req, res) => {
    const { usuario, descricao } = req.body;

    // Salvar a solicitação no banco de dados
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

// Rota para listar todas as solicitações do banco de dados
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

// Rota para salvar um novo setor
app.post('/salvar_setor', (req, res) => {
    const { nome, responsavel } = req.body;

    // Verificar se o nome do setor foi enviado
    if (!nome) {
        return res.status(400).send('O nome do setor é obrigatório.');
    }

    // Inserir o novo setor no banco de dados
    const sql = 'INSERT INTO setores (nome, responsavel) VALUES (?, ?)';
    db.run(sql, [nome, responsavel], function(err) {
        if (err) {
            console.error('Erro ao cadastrar setor:', err);
            return res.status(500).send('Erro ao cadastrar setor');
        }
        res.status(200).send('Setor cadastrado com sucesso!');
    });
});

 // Rota para servir o arquivo JavaScript (cadastroSetor.js)
app.get('/cadastroSetor.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.sendFile(path.join(__dirname, 'cadastroSetor.js'));
});

// Rota para servir a página de login (login.html)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Rota para servir a página de menu (menu.html)
app.get('/menu', (req, res) => {
    res.sendFile(path.join(__dirname, 'menu.html'));
});


// Rota para servir o arquivo usuario.html
app.get('/usuario.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'usuario.html'));
});

// Rota para servir o arquivo setor.html
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

// Rota para servir o arquivo procedimento.html
app.get('/procedimento.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'procedimento.html'));
});

// Rota para renderizar a página HTML
app.get('/historico_solicitacoes.html', (req, res) => {
    // Conectar ao banco de dados SQLite
    let db = new sqlite3.Database('database.sqlite');

    // Consulta ao banco de dados para recuperar as solicitações
    db.all('SELECT * FROM produtos', (err, rows) => {
        if (err) {
            console.error(err.message);
            res.status(500).send('Erro ao recuperar os dados do banco de dados');
            return;
        }

        // Renderiza a página HTML com os dados recuperados do banco de dados
        res.render('historico_solicitacoes', { solicitudes: rows });
    });

    // Fechar a conexão com o banco de dados após a consulta
    db.close();
});

// Rota para lidar com outros erros não tratados
app.use((err, req, res, next) => {
    console.error('Erro no servidor:', err);
    res.status(500).send('Erro interno no servidor');
});

// Função para gerar um código aleatório único
function generateRandomCode() {
    return Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
}

// Iniciar o servidor
app.listen(port, () => {
    console.log(`Servidor rodando em ${port}`);
});

// Fechar o banco de dados ao finalizar o servidor
process.on('exit', () => {
    db.close((err) => {
        if (err) {
            console.error('Erro ao fechar conexão com o banco de dados:', err.message);
        } else {
            console.log('Conexão com o banco de dados fechada.');
        }
    });
});
