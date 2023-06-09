const express = require('express')
const path = require('path')
const sqlite3 = require('sqlite3')
const sqlite = require('sqlite')
const multer = require('multer')
const fs = require('fs')
const app = express()
const PORT = 3000

function formatPrice(price) {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

async function getDBConnection() {
    const db = await sqlite.open({
        filename: 'product.db',
        driver: sqlite3.Database
        });
    return db;
}

function indexTemplate(products) {
    const productTemplate = products.map((product) => {
        return `
          <div class="book-container">
            <div class="image-container" onclick="location.href = '/product/${product.product_id}'">
              <img class="book-image" src="images/${product.product_image}" alt="${product.product_title}">
            </div>
            <div class="book-title">${product.product_title}</div>
            <div class="book-info">${product.product_author} 저</div>
            <div class="book-price">${formatPrice(product.product_price)}원</div>
          </div>
        `;
      }).join('');

    let template = `
    <!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>메인 - 아무거나 서점</title>
    <link rel="stylesheet" type="text/css" href="/main.css">
</head>
<body>
    <section class="head-container">
        <div class="inner">
            <div class="title-container">
                <div class="title">아무거나 서점</div>
                <div class="subtitle">ANYTHING BOOKSTORE</div>
            </div>
            <div class="nav">
                <a class="nav-link" href="/">메인</a>
                <a class="nav-link" href="/login">로그인</a>
                <a class="nav-link" href="/signup">회원가입</a>
            </div>
            <div class="hr"><hr></div>
        </div>
    </section>

    <section class="body-container">
        <div class="inner">
            <div class="section-name">원하는 도서를 검색해보세요</div>
            <section class="search-section">
                <form id="searchForm" method="get" action="/search">
                    <select id="category" name="category">
                        <option selected>전체</option>
                        <option>소설/시</option>
                        <option>자기계발</option>
                        <option>자연과학</option>
                    </select>
                    <input type="search" id="searchTerm" name="term" placeholder="제목 또는 저자를 검색하세요">
                    <select id="sort" name="sort">
                        <option selected>제목순</option>
                        <option>최저가순</option>
                        <option>최고가순</option>
                    </select>
                    <input type="submit" id="searchBtn" value="검색"/>
                </form>
            </section>
            <section class="book-section">
                <div class="book-list-container">
                ${productTemplate}
                </div>
            </section>
        </div>
    </section>
    <section class="foot-container">
        <div class="inner">
            <div class="hr"><hr></div>
            <div class="footer-info">(주)아무거나</div>
            <div class="footer-info">TEL 070-XXXX-XXXX</div>
        </div>
    </section>
</body>
</html>`
    return template;
}

function detailTemplate(product, comments) {
    let commentTemplate = comments.map(comment => {
        return `<div class="comment">${comment}</div>`;
    }).join('');

    let template = `<!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>상세페이지 - 아무거나 서점</title>
        <link rel="stylesheet" type="text/css" href="/main.css">
    </head>
    <body>
        <section class="head-container">
            <div class="inner">
                <div class="title-container">
                    <div class="title">아무거나 서점</div>
                    <div class="subtitle">ANYTHING BOOKSTORE</div>
                </div>
                <div class="nav">
                    <a class="nav-link" href="/">메인</a>
                    <a class="nav-link" href="/login">로그인</a>
                    <a class="nav-link" href="/signup">회원가입</a>
                </div>
                <div class="hr"><hr></div>
            </div>
        </section>
    
        <section class="body-container">
            <div class="inner">
                <div class="detail-container">
                    <div class="detail-left">
                        <img class="detail-image" src="/images/${product.product_image}" alt="${product.product_title}">
                    </div>
                    <div class="detail-right">
                        <div class="detail-info">
                            <div class="detail-category">${product.product_category}</div>
                            <div class="detail-title">${product.product_title}</div>
                            <div class="detail-author">${product.product_author} 저</div>
                            <div class="detail-price">${formatPrice(product.product_price)}원</div>
                        </div>
                        <div class="comment-section">
                            <div class="comment-title">한줄평 남기기</div>
                            <form name="comment" action="/product/${product.product_id}/postcomment" method="post">
                                <input type="text" name="comment">
                                <input type="submit" value="등록">
                            </form>
                            <div class="comment-list">
                                ${commentTemplate}
                            </div>
                        </div>
                        
                    </div>
                </div>
            </div>
        </section>
        
        <section class="foot-container">
            <div class="inner">
                <div class="hr"><hr></div>
                <div class="footer-info">(주)아무거나</div>
                <div class="footer-info">TEL 070-XXXX-XXXX</div>
            </div>
        </section>
    </body>
    </html>`
    return template;
}

app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

/* index.html */
app.get('/', async (req, res) => {
    let db = await getDBConnection();
    let products = await db.all('select * from Products');
    await db.close();
    const template = indexTemplate(products);
    res.send(template);
})

app.get('/search', async (req, res) => {
    const category = req.query.category;
    const term = req.query.term.trim();
    const sort = req.query.sort;

    let db = await getDBConnection();
    let products = await db.all('select * from Products');
    await db.close();
    
    const filteredC = filterCategory(products, category);
    const filteredT = filterSearchTerm(filteredC, term);
    const sorted = sortProducts(filteredT, sort);
    
    const template = indexTemplate(sorted);
    res.send(template);
    //sorted를 index.html 또는 script.js에 전달
})

function filterCategory(products, category) {
    if (category === '전체') {
      return products.slice();
    } else {
      return products.filter(product => product.product_category === category);
    }
  }

function filterSearchTerm(products, term) {
    if (term === '') {
        return products.slice();
    } else {
      return products.filter(
        product => product.product_title.includes(term) || product.product_author.includes(term)
      );
    }
} 

function sortProducts(products, sort) {
    if (sort === '제목순') {
      return products.sort((a, b) => (a.product_title > b.product_title ? 1 : -1));
    } else if (sort === '최저가순') {
      return products.sort((a, b) => a.product_price - b.product_price);
    } else {
      return products.sort((a, b) => b.product_price - a.product_price);
    }
}

/* login.html */
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
})

/* signup.html */
app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'signup.html'));
})

/* detail.html */
app.get('/product/:product_id', async (req, res) => {
    const productId = req.params.product_id;
    let db = await getDBConnection();
    let product = await db.all(`select * from Products where product_id = ${productId}`);
    await db.close();

    let data = await fs.promises.readFile('comment.json', 'utf8');
    comments = JSON.parse(data);
    const template = detailTemplate(product[0], comments[productId] || []);
    res.send(template);
})
app.post('/product/:product_id/postcomment', async (req, res) => {
    const productId = req.params.product_id;
    const comment = req.body.comment;
    
    let data = await fs.promises.readFile('comment.json', 'utf8');
    let comments = JSON.parse(data);
    comments[productId] = comments[productId] || [];
    comments[productId].push(comment);

    await fs.promises.writeFile('comment.json', JSON.stringify(comments, null, 2), 'utf8');

    res.redirect(`/product/${productId}`);
})

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}/`))