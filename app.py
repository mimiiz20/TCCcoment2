from flask import Flask, render_template, request, jsonify, redirect, session, url_for
import mysql.connector
import os
import bcrypt
from werkzeug.utils import secure_filename

app = Flask(__name__)
app.secret_key = "brasil"


# GERAR SENHA BCRYPT
def gerar_hash(senha_texto):
    senha_bytes = senha_texto.encode('utf-8')
    salt = bcrypt.gensalt()
    senha_hash = bcrypt.hashpw(senha_bytes, salt)
    return senha_hash.decode('utf-8')  

def verificar_senha(senha_digitada, hash_armazenado):
    if not hash_armazenado:
        return False
    senha_bytes = senha_digitada.encode('utf-8')
    hash_bytes = hash_armazenado.encode('utf-8')
    return bcrypt.checkpw(senha_bytes, hash_bytes)

#CONEXÃO
def get_db():
    return mysql.connector.connect(
        host="almoxarifado-mysql", # Mudei pra rodar no Docker, mas era 127.0.0.1
        user='root',
        password='',
        database='almoxarifado',
        charset='utf8mb4',
    )

# AUTORIZAÇÃO
def login_required():
    return 'usuario' in session

def admin_required():
    return session.get('tipo') == 'admin'

# HOME
@app.route('/')
def home():
    return render_template('index.html')

# LOGIN
@app.route('/login', methods=['POST'])
def login():
    email = request.form.get('email')
    senha = request.form.get('senha')

    conexao = get_db()
    cursor = conexao.cursor()

    cursor.execute("""
        SELECT * FROM usuarios
        WHERE email = %s
    """, (email,))

    user = cursor.fetchone()
    print(user)

    cursor.close()
    conexao.close()

    if user and verificar_senha(senha, user[4]):
        session['usuario'] = user[1]
        session['email'] = user[2]
        session['tipo'] = user[3]
        return redirect('/tabela')

    return render_template ('login_erro.html', erro=True)

# LOGIN INCORRETO
@app.route('/login_erro.html')
def login_erro():
    return render_template('login_erro.html')

# LOGIN DO APLICATIVO
@app.route('/login_app', methods=['POST'])
def login_app():

    dados = request.get_json()

    if not dados:
        return jsonify({
            'mensagem': 'Nenhum dado recebido'
        }), 400

    email = dados.get('email')
    senha = dados.get('senha')

    if not email or not senha:
        return jsonify({
            'mensagem': 'Email e senha são obrigatórios'
        }), 400

    conexao = get_db()
    cursor = conexao.cursor()

    cursor.execute("""
        SELECT id, user, email, tipo, senha
        FROM usuarios
        WHERE email = %s
    """, (email,))

    usuario = cursor.fetchone()

    cursor.close()
    conexao.close()

    # Usuário não encontrado
    if not usuario:
        return jsonify({
            'mensagem': 'Email ou senha incorretos'
        }), 401

    # Verifica a senha usando bcrypt
    if not verificar_senha(senha, usuario[4]):
        return jsonify({
            'mensagem': 'Email ou senha incorretos'
        }), 401

    # Login correto
    return jsonify({
        'mensagem': 'Login realizado com sucesso',
        'id': usuario[0],
        'usuario': usuario[1],
        'email': usuario[2],
        'tipo': usuario[3]
    }), 200

# LOGOUT
@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('home'))

# TABELA
@app.route('/tabela')
def tabela():
    if not login_required():
        return redirect('/')

    conexao = get_db()
    cursor = conexao.cursor()

    cursor.execute("SELECT * FROM estoque")
    resultado = cursor.fetchall()

    cursor.close()
    conexao.close()

    return render_template('tabela.html', resultado=resultado)

# ENTRADA / SAÍDA ESTOQUE

@app.route('/entrada', methods=['POST'])
def entrada():

    nome = request.form.get('nome')
    categoria = request.form.get('categoria')
    qtde = request.form.get('qtde')
    responsavel = request.form.get('responsavel')
    estoque_min = request.form.get('estoque_min')
    preco = request.form.get('preco')
    descricao = request.form.get('descricao')
    tipo = request.form.get('tipo')
    imagem = request.files.get("imagem")

    if imagem:
        nome_arquivo = secure_filename(imagem.filename)

        pasta = os.path.join("static", "uploads")
        os.makedirs(pasta, exist_ok=True)

        caminho_salvar = os.path.join(pasta, nome_arquivo)
        imagem.save(caminho_salvar)

        caminho_imagem = url_for('static', filename=f'uploads/{nome_arquivo}')
    else:
        conexao = get_db()
        cursor = conexao.cursor()

        cursor.execute("SELECT imagem FROM estoque WHERE nome = %s", (nome,))
        foto = cursor.fetchone()
        caminho_imagem = foto[0]
        cursor.close()
        conexao.close()

    if not nome or not qtde or not responsavel or not tipo:
        return jsonify({"success": False, "erro": "Campos obrigatórios"}), 400
    qtde = int(qtde)

    conexao = get_db()
    cursor = conexao.cursor()

    cursor.execute("SELECT qtde, preco FROM estoque WHERE nome = %s", (nome,))
    item = cursor.fetchone()


    if item:

        cursor.execute("""
            SELECT categoria, estoque_min, descricao, preco
            FROM estoque
            WHERE nome = %s
        """, (nome,))

        dados = cursor.fetchone()

        categoria_atual, estoque_min_atual, descricao_atual, preco_atual = dados

        categoria = categoria if categoria else categoria_atual

        estoque_min = (
            int(estoque_min)
            if estoque_min
            else estoque_min_atual
        )

        descricao = descricao if descricao else descricao_atual

        if preco:
            preco = float(preco)
        else:
            preco = 0

# ENTRADA (SOMA)
    if tipo == "entrada":

        if item:
            qtde_atual, preco_atual = item

            nova_qtde = qtde_atual + qtde
            novo_preco = float(preco_atual) + float(preco)
            
            cursor.execute("""
                UPDATE estoque
                SET qtde = %s,
                    estoque_min = %s,
                    categoria = %s,
                    preco = %s,
                    descricao = %s,
                    imagem = %s
                WHERE nome = %s
            """, (nova_qtde, estoque_min, categoria, novo_preco, descricao, caminho_imagem, nome))
            conexao.commit()
        else:
            cursor.execute("""
                INSERT INTO estoque
                (responsavel, nome, categoria, qtde, estoque_min, descricao, preco, imagem)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """, (responsavel, nome, categoria, qtde, estoque_min, descricao, preco, caminho_imagem))

        conexao.commit()

# SAÍDA (SUBTRAI)
    elif tipo == "saida":

        cursor.execute(
            "SELECT qtde, preco FROM estoque WHERE nome = %s",
            (nome,)
        )

        produto = cursor.fetchone()

        if not produto:
            return jsonify({
                "success": False,
                "erro": "Produto não encontrado"
            }), 404

        qtde_atual, preco_atual = produto

        if qtde_atual < qtde:
            return jsonify({
                "success": False,
                "erro": "Estoque insuficiente"
            }), 400

        nova_qtde = qtde_atual - qtde
        novo_preco = float(preco_atual) - float(preco)

        if novo_preco < 0:
            novo_preco = 0

        cursor.execute("""
            UPDATE estoque
            SET qtde = %s,
                estoque_min = %s,
                categoria = %s,
                preco = %s,
                descricao = %s,
                imagem = %s
            WHERE nome = %s
        """, (
            nova_qtde,
            estoque_min,
            categoria,
            novo_preco,
            descricao,
            caminho_imagem,
            nome
        ))

        conexao.commit()

    else:
        return jsonify({"success": False, "erro": "Tipo inválido"}), 400

    cursor.close()
    conexao.close()

    return jsonify({"success": True}), 200

# ENTRADA DO APLICATIVO
@app.route('/entrada_app', methods=['POST'])
def entrada_app():

    nome = request.form.get('nome')
    categoria = request.form.get('categoria')
    qtde = request.form.get('qtde')
    responsavel = request.form.get('responsavel')
    estoque_min = request.form.get('estoque_min')
    preco = request.form.get('preco')
    descricao = request.form.get('descricao')
    tipo = request.form.get('tipo')
    imagem = request.files.get('imagem')

    if nome:
        nome = nome.strip()
    if categoria:
        categoria = categoria.strip()
    if responsavel:
        responsavel = responsavel.strip()
    if descricao:
        descricao = descricao.strip()

    if not nome or not qtde or not responsavel or not tipo:
        return jsonify({
            "success": False,
            "erro": "Campos obrigatórios"
        }), 400

    try:
        qtde = int(qtde)

        if qtde <= 0:
            return jsonify({
                "success": False,
                "erro": "Quantidade deve ser maior que zero"
            }), 400

        estoque_min = int(estoque_min) if estoque_min else 0
        preco = float(preco) if preco else 0.0

    except (ValueError, TypeError):
        return jsonify({
            "success": False,
            "erro": "Quantidade, preço ou estoque mínimo inválido"
        }), 400

    caminho_imagem = None

    if imagem:
        nome_arquivo = secure_filename(imagem.filename)

        pasta = os.path.join(
            app.root_path,
            'static',
            'uploads'
        )

        os.makedirs(pasta, exist_ok=True)

        imagem.save(
            os.path.join(pasta, nome_arquivo)
        )

        caminho_imagem = url_for(
            'static',
            filename=f'uploads/{nome_arquivo}'
        )

    conexao = None
    cursor = None

    try:
        conexao = get_db()
        cursor = conexao.cursor()

        cursor.execute("""
            SELECT qtde, preco, categoria, estoque_min, descricao, imagem
            FROM estoque
            WHERE TRIM(nome) = TRIM(%s)
            LIMIT 1
        """, (nome,))

        produto = cursor.fetchone()

        # ENTRADA (SOMA)
        if tipo == "entrada":

            if produto:

                qtde_atual = int(produto[0] or 0)
                preco_atual = float(produto[1] or 0)

                nova_qtde = qtde_atual + qtde
                novo_preco = preco_atual + preco

                categoria_final = categoria if categoria else produto[2]
                estoque_min_final = estoque_min if estoque_min else produto[3]
                descricao_final = descricao if descricao else produto[4]

                # Mantém a imagem antiga se não escolher outra
                imagem_final = caminho_imagem if caminho_imagem else produto[5]

                cursor.execute("""
                    UPDATE estoque
                    SET qtde = %s,
                        preco = %s,
                        categoria = %s,
                        estoque_min = %s,
                        descricao = %s,
                        responsavel = %s,
                        imagem = %s
                    WHERE TRIM(nome) = TRIM(%s)
                """, (
                    nova_qtde,
                    novo_preco,
                    categoria_final,
                    estoque_min_final,
                    descricao_final,
                    responsavel,
                    imagem_final,
                    nome
                ))

            else:
                cursor.execute("""
                    INSERT INTO estoque
                    (responsavel, nome, categoria, qtde,
                     estoque_min, descricao, preco, imagem)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    responsavel,
                    nome,
                    categoria,
                    qtde,
                    estoque_min,
                    descricao,
                    preco,
                    caminho_imagem
                ))

                nova_qtde = qtde
                novo_preco = preco

        # SAÍDA (SUBTRAI)
        elif tipo == "saida":

            if not produto:
                return jsonify({
                    "success": False,
                    "erro": "Produto não encontrado"
                }), 404

            qtde_atual = int(produto[0] or 0)
            preco_atual = float(produto[1] or 0)

            if qtde_atual < qtde:
                return jsonify({
                    "success": False,
                    "erro": f"Estoque insuficiente. Disponível: {qtde_atual}"
                }), 400

            nova_qtde = qtde_atual - qtde
            novo_preco = preco_atual - preco

            if novo_preco < 0:
                novo_preco = 0

            categoria_final = categoria if categoria else produto[2]
            estoque_min_final = estoque_min if estoque_min else produto[3]
            descricao_final = descricao if descricao else produto[4]
            imagem_final = caminho_imagem if caminho_imagem else produto[5]

            cursor.execute("""
                UPDATE estoque
                SET qtde = %s,
                    preco = %s,
                    categoria = %s,
                    estoque_min = %s,
                    descricao = %s,
                    responsavel = %s,
                    imagem = %s
                WHERE TRIM(nome) = TRIM(%s)
            """, (
                nova_qtde,
                novo_preco,
                categoria_final,
                estoque_min_final,
                descricao_final,
                responsavel,
                imagem_final,
                nome
            ))

        else:
            return jsonify({
                "success": False,
                "erro": "Tipo inválido"
            }), 400

        conexao.commit()

        return jsonify({
            "success": True,
            "mensagem": "Operação realizada com sucesso",
            "nova_quantidade": nova_qtde,
            "novo_preco": novo_preco,
            "imagem": caminho_imagem
        }), 200

    except Exception as erro:

        print("ERRO ENTRADA:", repr(erro))

        if conexao:
            conexao.rollback()

        return jsonify({
            "success": False,
            "erro": str(erro)
        }), 500

    finally:

        if cursor:
            cursor.close()

        if conexao:
            conexao.close()

# TABELA DO APLICATIVO
@app.route('/tabela_app', methods=['GET'])
def tabela_app():

    conexao = None
    cursor = None

    try:
        conexao = get_db()
        cursor = conexao.cursor()

        cursor.execute("""
            SELECT
                id,
                responsavel,
                nome,
                categoria,
                qtde,
                estoque_min,
                preco,
                descricao,
                imagem
            FROM estoque
            ORDER BY id ASC
        """)

        resultado = cursor.fetchall()

        produtos = []

        for item in resultado:

            produtos.append({
                "id": item[0],
                "responsavel": item[1],
                "nome": item[2],
                "categoria": item[3],
                "qtde": item[4],
                "estoque_min": item[5],
                "preco": float(item[6]) if item[6] is not None else 0,
                "descricao": item[6],
                "imagem": item[8]
            })

        return jsonify({
            "success": True,
            "produtos": produtos
        }), 200

    except Exception as erro:

        print("ERRO TABELA APP:", repr(erro))

        return jsonify({
            "success": False,
            "erro": "Erro ao buscar produtos"
        }), 500

    finally:

        if cursor:
            cursor.close()

        if conexao:
            conexao.close()

# EXCLUIR ITEM
@app.route('/excluir/<int:id>', methods=['DELETE'])
def excluir(id):

    conexao = get_db()
    cursor = conexao.cursor()

    cursor.execute("DELETE FROM estoque WHERE id = %s", (id,))
    conexao.commit()

    cursor.close()
    conexao.close()

    return jsonify({"success": True})

# EDITAR
@app.route('/editar')
def editar():
    if not login_required():
        return redirect('/')

    return render_template('editar.html')

# ACESSO
@app.route('/acesso')
def acesso():
    if not login_required():
        return redirect('/')

    if not admin_required():
        return "Acesso negado"

    conexao = get_db()
    cursor = conexao.cursor()

    cursor.execute("SELECT * FROM usuarios")
    resultado = cursor.fetchall()

    cursor.close()
    conexao.close()

    return render_template('acesso.html', resultado=resultado)

# EXCLUIR USUÁRIO
@app.route('/excluirUsuario/<int:id>', methods=['DELETE'])
def excluir_usuario(id):

    conexao = get_db()
    cursor = conexao.cursor()

    cursor.execute("DELETE FROM usuarios WHERE id = %s", (id,))

    conexao.commit()

    cursor.close()
    conexao.close()

    return jsonify({"success": True})

# CADASTRO
@app.route('/cadastro', methods=['GET', 'POST'])
def cadastro():

    if not login_required():
        return redirect('/')

    if not admin_required():
        return "Acesso negado"

    if request.method == 'GET':
        return render_template('cadastro.html')

    usuario = request.form.get('user')
    email = request.form.get('email')
    senha = request.form.get('senha')
    perfil = request.form.get('perfil')

    senha_criptografada = gerar_hash(senha)

    conexao = get_db()
    cursor = conexao.cursor()

    cursor.execute("""
        INSERT INTO usuarios (user, email, senha, tipo)
        VALUES (%s, %s, %s, %s)
    """, (usuario, email, senha_criptografada, perfil))

    conexao.commit()
    cursor.close()
    conexao.close()

    return redirect('/acesso')

# CADASTRO DO APP
@app.route('/cadastro_app', methods=['POST'])
def cadastro_app():

    try:
        dados = request.get_json()

        usuario = dados.get('user')
        email = dados.get('email')
        senha = dados.get('senha')
        perfil = "usuario"

        if not usuario or not email or not senha:
            return jsonify({
                'mensagem: Preencha todos os campos'
            }), 400
        
        senha_criptografada = gerar_hash(senha)

        conexao = get_db()
        cursor = conexao.cursor()

        cursor.execute(
            "SELECT id FROM usuarios WHERE email = %s",
            (email,)
        )

        usuario_existente = cursor.fetchone()

        if usuario_existente:
            cursor.close()
            conexao.close()

            return jsonify({
                'mensagem': 'Este email já está cadastrado'
            }), 400

        # Cadastra o usuário
        cursor.execute("""
            INSERT INTO usuarios (user, email, senha, tipo)
            VALUES (%s, %s, %s, %s)
        """, (usuario, email, senha_criptografada, perfil))

        conexao.commit()

        cursor.close()
        conexao.close()

        return jsonify({
            'mensagem': 'Usuário cadastrado com sucesso'
        }), 201

    except Exception as erro:
        print('ERRO NO CADASTRO:', repr(erro))

        return jsonify({
            'mensagem': 'Erro ao cadastrar usuário',
            'erro': str(erro)
        }), 500

# CONTAS DO APP
@app.route('/contas_app', methods=['GET'])
def contas_app():

    conexao = None
    cursor = None

    try:
        conexao = get_db()
        cursor = conexao.cursor()

        cursor.execute("""
            SELECT id, user, email, tipo
            FROM usuarios
            ORDER BY id ASC
        """)

        resultado = cursor.fetchall()

        usuarios = []

        for item in resultado:
            usuarios.append({
                "id": item[0],
                "nome": item[1],
                "email": item[2],
                "tipo": item[3]
            })

        return jsonify({
            "success": True,
            "usuarios": usuarios
        }), 200

    except Exception as erro:

        print("ERRO CONTAS APP:", repr(erro))

        return jsonify({
            "success": False,
            "erro": "Erro ao buscar usuários"
        }), 500

    finally:

        if cursor:
            cursor.close()

        if conexao:
            conexao.close()
            
# RODAR
if __name__ == '__main__':
    app.run(debug=True, host="0.0.0.0", port=5000)
