fetch('product.json')
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }
    return response.json();
  })
  .then(json => initialize(json))
  .catch(err => console.error(`Fetch problem: ${err.message}`));

async function initialize(products) {
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

  sortedGroup = products;
  updateDisplay();

  categoryGroup = [];
  searchTermGroup = [];
  sortedGroup = [];

  searchBtn.addEventListener('click', filterProducts);

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
      categoryGroup = products;
    } else {
      categoryGroup = products.filter(product => product.category === category.value);
    }
    filterSearchTerm();
  }

  function filterSearchTerm() {
    if (searchTerm.value.trim() === '') {
      searchTermGroup = categoryGroup;
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
      sortedGroup = searchTermGroup;
    } else if (sort.value === '최저가순') {
      sortedGroup = products.sort((a, b) => a.price - b.price);
    } else {
      sortedGroup = products.sort((a, b) => b.price - a.price);
    }
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
    try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP error: ${response.status}`);
        }
        const blob = await response.blob();
        await showProduct(blob, product);
      } catch (err) {
        console.error(`Fetch problem: ${err.message}`);
      }
  }

  async function showProduct(blob, product) {
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

    bookImage.addEventListener('click', function () {
      bookImage.style.display = 'none';
      imageContainer.style.backgroundColor = 'black';
      rating.style.color = 'white';
      description.style.color = 'white';
    });
  }

  function formatPrice(price) {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }
}
