import { createGlobalStyle } from 'styled-components';

export const GlobalStyle = createGlobalStyle`
  .image-gallery-svg {
    color: #fff;
  }

  button.image-gallery-left-nav,
  button.image-gallery-right-nav {
    .image-gallery-svg {
      height: 46px;
      width: 18px;
    }
  }

  button.image-gallery-fullscreen-button {
    .image-gallery-svg {
      height: 26px;
      width: 26px;
    }
  }

  @media (min-width: 960px) {
    button.image-gallery-left-nav,
    button.image-gallery-right-nav {
      .image-gallery-svg {
        height: 46px;
        width: 18px;
      }
    }
    button.image-gallery-fullscreen-button {
      .image-gallery-svg {
        height: 26px;
        width: 26px;
      }
    }
  }
  
  .image-gallery-content .image-gallery-slide .image-gallery-image {
    max-height: calc(100vh - 108px);
  }

  .image-gallery-thumbnail.active {
    border-color: #9e9e9e;
  }

  .image-gallery-thumbnail:hover {
    border-color: #9e9e9e;
  }

`;
