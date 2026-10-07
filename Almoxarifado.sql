CREATE DATABASE almoxarifado;

USE almoxarifado;

CREATE TABLE estoque (
    id INT PRIMARY KEY AUTO_INCREMENT,
    responsavel VARCHAR(100),
    nome VARCHAR(255),
    categoria VARCHAR (100),
    qtde INT,
    estoque_min INT,
    preco DECIMAL (10,2),
	descricao VARCHAR (500),
    imagem VARCHAR(255)
);

CREATE TABLE usuarios (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    tipo VARCHAR(20) NOT NULL DEFAULT 'usuario',
    senha VARCHAR(255) NOT NULL
);

INSERT INTO estoque (responsavel, nome, categoria, qtde, estoque_min, preco, descricao, imagem)
VALUES ("Roger", "Chave Fenda", "Ferramenta", 12, 24, 25.00, "Chave de fenda pequena", "/static/chave_fenda.jpg");
INSERT INTO estoque (responsavel, nome, categoria, qtde, estoque_min, preco, descricao, imagem)
VALUES ("Vivianne", "Alicate", "Ferramenta", 8, 28, 28.00, "Alicate da marca Tramontina", "/static/alicate.jpg");

INSERT INTO usuarios (user, email, tipo, senha)
VALUES ('Administrador', 'admin@empresa.com', 'admin', '$2a$12$glWRAuHWTu6VOfiVxBmFNON0HiHey93me9JvMPsTEnNrI0GcB3aMW');
INSERT INTO usuarios (user, email, tipo, senha)
VALUES ('Joao', 'joao@empresa.com', 'usuario', '$2b$12$lDdSXPZpJxgQcafk/zhrnOOvU1KHfuig5Cy90cHjWaWhDC0ZFLRmK');	



