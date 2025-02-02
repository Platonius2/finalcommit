import React from 'react';
import styled from 'styled-components';

const LogoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 2rem;
  max-width: 1200px;
  margin: 4rem auto;
  padding: 0 1rem;
`;

const LogoContainer = styled.div`
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 12px rgba(0, 0, 0, 0.15);
  }

  img {
    max-width: 120px;
    height: auto;
    filter: grayscale(100%);
    opacity: 0.7;
    transition: all 0.3s ease;
  }

  &:hover img {
    filter: grayscale(0%);
    opacity: 1;
  }
`;

const ClientLogos = () => {
  const logos = [
    {
      name: 'Google',
      url: 'https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png'
    },
    {
      name: 'Microsoft',
      url: 'https://img-prod-cms-rt-microsoft-com.akamaized.net/cms/api/am/imageFileData/RE1Mu3b?ver=5c31'
    },
    {
      name: 'Apple',
      url: 'https://www.apple.com/ac/globalnav/7/en_US/images/be15095f-5a20-57d0-ad14-cf4c638e223a/globalnav_apple_image__b5er5ngrzxqq_large.svg'
    },
    {
      name: 'Amazon',
      url: 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg'
    },
    {
      name: 'Meta',
      url: 'https://upload.wikimedia.org/wikipedia/commons/7/7b/Meta_Platforms_Inc._logo.svg'
    },
    {
      name: 'Netflix',
      url: 'https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg'
    }
  ];

  return (
    <section>
      <LogoGrid>
        {logos.map((logo) => (
          <LogoContainer key={logo.name}>
            <img src={logo.url} alt={`${logo.name} logo`} />
          </LogoContainer>
        ))}
      </LogoGrid>
    </section>
  );
};

export default ClientLogos; 