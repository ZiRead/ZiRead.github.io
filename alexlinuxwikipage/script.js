const categoryMarkers = [
  'Раздел про ALT Linux',
  'Раздел про Astra linux',
  'Раздел про Windows',
];

const instructionMarkers = [
  { prefix: 'Если с X11 KDE', label: 'Проблема Win + L в KDE' },
  { prefix: 'Установка KDE', label: 'Установка KDE' },
  { prefix: 'Если битрикс', label: 'Bitrix не открывается' },
  { prefix: 'Если после переименования hostname', label: 'Яндекс.Браузер и hostname' },
  { prefix: 'Тех. поддержка', label: 'Контакты и ссылки' },
  { prefix: 'Установка ALT Linux', label: 'Установка ALT Linux' },
  { prefix: 'устые общие папки:', label: 'Общие папки' },
  { prefix: '!!!От имени юзера!!!', label: 'Ключи КриптоПро (значения скрыты)' },
  { prefix: 'Установка VNC', label: 'Установка VNC' },
  { prefix: 'Прочие команды:', label: 'Прочие команды' },
  { prefix: 'Команды КриптоПро Linux:', label: 'Команды КриптоПро Linux' },
  { prefix: 'Если наебнулся libc', label: 'Восстановление libc' },
  { prefix: 'Если CUPS грузит ЦП', label: 'Высокая загрузка ЦП в CUPS' },
  { prefix: 'Убить беспровод', label: 'Отключение Wi-Fi' },
  { prefix: 'CUPS ругается', label: 'Ошибка конфигурации CUPS' },
  { prefix: 'Яндере браузер', label: 'Яндекс.Браузер не запускается' },
  { prefix: 'Если Chromium Gost', label: 'Проблемы с Chromium Gost' },
  { prefix: 'Если ничего не печатается', label: 'Печать в системных окнах' },
  { prefix: 'Если после логина', label: 'После входа открывается терминал' },
  { prefix: 'Если система лагает', label: 'Зависания без нагрузки' },
  { prefix: 'Установка Astra linux', label: 'Установка Astra Linux' },
  { prefix: '3.1)Установка_КриптоПРО', label: 'Установка КриптоПРО' },
  { prefix: '3.2) Устанавливаем HOSTS', label: 'Настройка HOSTS' },
  { prefix: '3.3) Установка 1C', label: 'Установка 1С' },
  { prefix: 'Установка требуемых пакетов', label: 'Требуемые пакеты для 1С' },
  { prefix: 'Установка клиента 1С:Предприятие 8.3', label: 'Установка клиента 1С' },
  { prefix: '3.4) Установить R7', label: 'Установка R7' },
  { prefix: '3.5) Настроить принтер', label: 'Настройка принтера' },
  { prefix: 'Доп. информация:', label: 'Дополнительная информация' },
  { prefix: 'Без регистрации обновление не запустится.', label: 'Регистрация образа для обновления' },
  { prefix: 'Удалить каспер', label: 'Удаление Kaspersky' },
  { prefix: 'Обход входа в учетку Microsoft', label: 'Локальная учётная запись Windows' },
  { prefix: 'Установка Windows', label: 'Установка Windows' },
];

const instructionNav = document.querySelector('#instruction-nav');
const instructionsRoot = document.querySelector('#instructions');

function renderInstructions(source) {
  instructionNav.replaceChildren();
  instructionsRoot.replaceChildren();

  const lines = source.replace(/\r\n/g, '\n').split('\n');
  const categories = [];
  let currentCategory = null;
  let currentInstruction = null;
  let instructionNumber = 0;

  function flushInstruction() {
    if (!currentInstruction || !currentCategory) {
      return;
    }

    const article = document.createElement('article');
    article.className = 'instruction-card';
    article.id = `instruction-${instructionNumber}`;

    const heading = document.createElement('h3');
    heading.textContent = currentInstruction.heading;

    const text = document.createElement('pre');
    text.className = 'instruction-text';
    text.textContent = currentInstruction.lines.join('\n');

    article.append(heading, text);
    currentCategory.section.append(article);

    const link = document.createElement('a');
    link.className = 'instruction-link';
    link.href = `#${article.id}`;
    link.textContent = currentInstruction.label;
    currentCategory.nav.append(link);

    instructionNumber += 1;
    currentInstruction = null;
  }

  for (const line of lines) {
    const trimmedLine = line.trim();

    const categoryMarker = categoryMarkers.find(
      (marker) => marker.toLowerCase() === trimmedLine.toLowerCase(),
    );
    if (categoryMarker) {
      flushInstruction();

      const section = document.createElement('section');
      section.className = 'instruction-category';
      section.id = `category-${categories.length}`;

      const heading = document.createElement('h2');
      heading.textContent = categoryMarker;
      section.append(heading);
      instructionsRoot.append(section);

      const navGroup = document.createElement('div');
      navGroup.className = 'instruction-nav-group';
      const categoryLink = document.createElement('a');
      categoryLink.className = 'category-link';
      categoryLink.href = `#${section.id}`;
      categoryLink.textContent = categoryMarker.replace(/^Раздел про\s*/i, '');
      navGroup.append(categoryLink);
      instructionNav.append(navGroup);

      currentCategory = { section, nav: navGroup };
      categories.push(currentCategory);
      continue;
    }

    const isAstraInstallArticle = currentInstruction?.heading.toLowerCase().startsWith('установка astra linux');
    const marker = isAstraInstallArticle
      ? null
      : instructionMarkers.find(({ prefix }) => trimmedLine.toLowerCase().startsWith(prefix.toLowerCase()));
    if (marker) {
      flushInstruction();
      currentInstruction = {
        heading: trimmedLine,
        label: marker.label,
        lines: [],
      };
      continue;
    }

    if (currentInstruction) {
      currentInstruction.lines.push(line);
    }
  }

  flushInstruction();

  if (instructionNumber === 0) {
    throw new Error('В исходном файле не найдены инструкции.');
  }
}

fetch('instructions.txt')
  .then((response) => {
    if (!response.ok) {
      throw new Error(`Не удалось загрузить инструкции: HTTP ${response.status}`);
    }
    return response.text();
  })
  .then(renderInstructions)
  .catch((error) => {
    instructionNav.replaceChildren();
    instructionsRoot.replaceChildren();

    const message = document.createElement('p');
    message.className = 'load-error';
    message.textContent = `${error.message} Проверьте, что сайт открыт через веб-сервер и файл instructions.txt доступен.`;
    instructionsRoot.append(message);
  });
