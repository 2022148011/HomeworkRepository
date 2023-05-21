fetch('product.json')
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }
    return response.json();
  })
  .then(json => initialize(json))
  .catch(err => console.error(`Fetch problem: ${err.message}`));

function initialize(products) {
  const category = document.querySelector('#category');
  const searchTerm = document.querySelector('#searchTerm');
  const sort = document.querySelector('#sort');
  const searchBtn = document.querySelector('#searchBtn');
  const productListContainer = document.querySelector('.book-list-container');

    let lastCategory = category.value;
    let lastSearch = '';
    let lastSort = sort.value;

    let categoryGroup;
    let searchTermGroup;
    let sortedGroup;

    //1. 첫번째 줄 (4개) 표시
    //2. 스크롤 -> 화면길이 넘어가면 2번째 줄 product들을 append

    let currentLine = 1; // 현재 페이지
    const productsPerLine = 4; // 페이지당 표시할 제품 수
    let loading = false; // 로딩 상태

    const initialProducts = products.slice(0, productsPerLine);
    for (const product of initialProducts) {
      displayProduct(product);
    }

  categoryGroup = [];
  searchTermGroup = [];
  sortedGroup = [];

  searchBtn.addEventListener('click', filterProducts);

  window.onscroll = () => {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight && !loading) {
        loadLine();
    }
  }

  function loadLine() {
    loading = true;
    currentLine++;
    const startIndex = (currentLine - 1) * productsPerLine;
    const endIndex = (startIndex + productsPerLine > sortedGroup.length) ? sortedGroup.length : startIndex + productsPerLine;
    const newLine = sortedGroup.slice(startIndex, endIndex);

    for (const product of newLine) {
        displayProduct(product);
    }

    loading = false;
  }

  function filterProducts(e) {
    e.preventDefault();

    categoryGroup = [];
    searchTermGroup = [];
    sortedGroup = [];

    if (
      category.value === lastCategory &&
      searchTerm.value.trim() === lastSearch &&
      sort.value === lastSort
    ) {
      return;
    } else {
      lastCategory = category.value;
      lastSearch = searchTerm.value.trim();
      lastSort = sort.value;
      filterCategory();
    }
  }

  function filterCategory() {
    if (category.value === '전체') {
      categoryGroup = products.slice();
    } else {
      categoryGroup = products.filter(product => product.category === category.value);
    }
    filterSearchTerm();
  }

  function filterSearchTerm() {
    if (searchTerm.value.trim() === '') {
      searchTermGroup = categoryGroup.slice();
    } else {
      const term = searchTerm.value.trim();
      searchTermGroup = categoryGroup.filter(
        product => product.title.includes(term) || product.author.includes(term)
      );
    }
    sortProducts();
  }

  function sortProducts() {
    if (sort.value === '제목순') {
      sortedGroup = searchTermGroup.slice();
    } else if (sort.value === '최저가순') {
      sortedGroup = products.sort((a, b) => a.price - b.price);
    } else {
      sortedGroup = products.sort((a, b) => b.price - a.price);
    }
    console.log(sortedGroup);
    updateDisplay();
  }

  function updateDisplay() {
    while (productListContainer.firstChild) {
      productListContainer.removeChild(productListContainer.firstChild);
    }

    if (sortedGroup.length === 0) {
      const para = document.createElement('p');
      para.textContent = "'" + searchTerm.value + "'에 대한 검색결과가 없습니다";
      productListContainer.appendChild(para);
    } else {
      for (const product of sortedGroup) {
        displayProduct(product);
      }
    }
  }

  async function displayProduct(product) {
    const url = `images/${product.image}`;
     await fetch(url)
      .then( response => {
        if (!response.ok) {
          throw new Error(`HTTP error: ${response.status}`);
        }
        return response.blob();
      })
      .then( blob => showProduct(blob, product) )
      .catch( err => console.error(`Fetch problem: ${err.message}`) );
  }

  function showProduct(blob, product) {
    const objectURL = URL.createObjectURL(blob);

    const bookContainer = document.createElement('div');
    bookContainer.setAttribute('class', 'book-container');

    const imageContainer = document.createElement('div');
    imageContainer.setAttribute('class', 'image-container');

    const clickContainer = document.createElement('div');
    clickContainer.setAttribute('class', 'click-container');

    const description = document.createElement('div');
    description.setAttribute('class', 'click-description');
    description.innerText = product.description;

    const rating = document.createElement('div');
    rating.setAttribute('class', 'click-rating');
    rating.innerText = '★ ' + product.rating;

    const bookImage = document.createElement('img');
    bookImage.setAttribute('class', 'book-image');
    bookImage.src = objectURL;
    bookImage.alt = product.title;

    const bookTitle = document.createElement('div');
    bookTitle.setAttribute('class', 'book-title');
    bookTitle.innerText = product.title;

    const bookInfo = document.createElement('div');
    bookInfo.setAttribute('class', 'book-info');
    bookInfo.innerText = product.author + ' 저';

    const bookPrice = document.createElement('div');
    bookPrice.setAttribute('class', 'book-price');
    bookPrice.innerText = formatPrice(product.price) + '원';

    productListContainer.appendChild(bookContainer);
    bookContainer.appendChild(imageContainer);
    bookContainer.appendChild(bookTitle);
    bookContainer.appendChild(bookInfo);
    bookContainer.appendChild(bookPrice);
    imageContainer.appendChild(bookImage);
    imageContainer.appendChild(clickContainer);
    clickContainer.appendChild(rating);
    clickContainer.appendChild(description);

    imageContainer.addEventListener('click', function () {
      bookImage.style.display = 'none';
      imageContainer.style.backgroundColor = 'black';
      rating.style.display = 'block';
      description.style.display = 'block';
    });
  }

  function formatPrice(price) {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }
}
