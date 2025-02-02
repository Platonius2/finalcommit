import React from 'react'
import styled from 'styled-components'

const MainContainer = styled.div`
    min-height: 100vh;
    display: flex;
    align-items: center;
    padding: 2rem;
`;

const ContentWrapper = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4rem;
    width: 100%;
    max-width: 1400px;
    margin: 0 auto;

    @media (max-width: 1024px) {
        gap: 2rem;
    }

    @media (max-width: 768px) {
        grid-template-columns: 1fr;
        gap: 3rem;
    }
`;

const LogoGridWrapper = styled.div`
    position: relative;
    padding: 3rem;
    border-radius: 16px;
    overflow: hidden;

    &:before {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: 100%;
        height: 100%;
        transform: translate(-50%, -50%);
        background: 
            linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px);
        background-size: 25px 25px;
        pointer-events: none;
        opacity: 1;
        mask-image: radial-gradient(circle at center, black 40%, transparent 70%);
        -webkit-mask-image: radial-gradient(circle at center, black 40%, transparent 70%);
    }

    &:after {
        content: '';
        position: absolute;
        inset: 0;
        background: none;
        pointer-events: none;
    }
`;

const LogoGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 4rem;
    padding: 2rem;
    max-width: 800px;
    margin: 0 auto;
    position: relative;
    z-index: 1;

    & > *:nth-child(5) {
        grid-column: 1 / -1;
        justify-self: center;
    }

    @media (max-width: 1200px) {
        gap: 3rem;
    }

    @media (max-width: 768px) {
        gap: 2.5rem;
        max-width: 400px;
    }

    @media (max-width: 480px) {
        grid-template-columns: 1fr;
        max-width: 200px;
        gap: 2rem;

        & > *:nth-child(5) {
            grid-column: 1;
        }
    }
`;

const TitleSection = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;

    @media (max-width: 768px) {
        order: -1;
        text-align: center;
    }
`;

const Title = styled.h1`
    font-family: 'Clash Display', sans-serif;
    color: #ffffff;
    font-size: clamp(2.5rem, 5vw, 4.5rem);
    font-weight: 900;
    line-height: 1.1;
    margin: 0;
    text-transform: uppercase;
    letter-spacing: -0.02em;
    position: relative;
    text-align: right;

    @media (max-width: 768px) {
        text-align: center;
    }

    span {
        display: block;
        font-size: clamp(1rem, 2vw, 1.5rem);
        font-weight: 400;
        color: #ffffff;
        text-transform: none;
        margin-top: 1rem;
        letter-spacing: normal;
    }
`;

const LogoContainer = styled.a`
    aspect-ratio: 1;
    transition: all 0.3s ease;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: relative;
    text-decoration: none;
    cursor: pointer;
    padding: 0.5rem;
    background: none;
    border-radius: 8px;
    backdrop-filter: blur(10px);
    width: 140px;
    height: 140px;
    margin: 0 auto;

    &:hover {
        transform: scale(1.05);
        box-shadow: 0 0 50px rgba(255, 255, 255, 0.4),
                   0 0 100px rgba(255, 255, 255, 0.2);
    }

    img {
        max-width: 80%;
        max-height: 80%;
        object-fit: contain;
        opacity: 0.8;
        transition: all 0.3s ease;
        filter: brightness(0.9) contrast(1.1);
    }

    &:hover img {
        opacity: 1;
        filter: brightness(1.2) contrast(1.3);
    }

    @media (max-width: 480px) {
        width: 120px;
        height: 120px;
        padding: 0.4rem;
    }
`;

const CompanyName = styled.span`
    position: absolute;
    bottom: -2rem;
    left: 50%;
    transform: translateX(-50%);
    opacity: 0;
    transition: all 0.3s ease;
    background: rgba(255, 255, 255, 0.15);
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    font-size: clamp(0.8rem, 1.5vw, 0.9rem);
    white-space: nowrap;
    backdrop-filter: blur(5px);
    box-shadow: 0 0 20px rgba(255, 255, 255, 0.15);

    ${LogoContainer}:hover & {
        opacity: 1;
        bottom: -1rem;
        box-shadow: 0 0 25px rgba(255, 255, 255, 0.3),
                   0 0 50px rgba(255, 255, 255, 0.15);
    }
`;

const ClientLogos = () => {
    const logos = [
        {
            name: 'Dark Matter Design',
            url: '/logos/Dark Matter Design.jpg',
            website: 'https://darkmatterdesign.com'
        },
        {
            name: 'Nobody NFT',
            url: '/logos/nobodyNFT.png',
            website: 'https://nobody.xyz'
        },
        {
            name: 'Memorigin',
            url: '/logos/memorigin.png',
            website: 'https://memorigin.store'
        },
        {
            name: 'The Military Show',
            url: '/logos/The Military Show.jpg',
            website: 'https://www.youtube.com/@TheMilitaryShow'
        },
        {
            name: 'Huawei Slovenia',
            url: '/logos/huawei-logo.png',
            website: 'https://consumer.huawei.com/si/'
        }
    ];

    return (
        <section>
            <LogoGridWrapper>
                <LogoGrid>
                    {logos.map((logo) => (
                        <LogoContainer 
                            key={logo.name} 
                            href={logo.website}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <img src={logo.url} alt={`${logo.name} logo`} />
                            <CompanyName>{logo.name}</CompanyName>
                        </LogoContainer>
                    ))}
                </LogoGrid>
            </LogoGridWrapper>
        </section>
    );
};

const App = () => {
    return (
        <MainContainer>
            <ContentWrapper>
                <ClientLogos />
                <TitleSection>
                    <Title>
                        Our
                        <br />
                        Clients
                        <span>Trusted by the best</span>
                    </Title>
                </TitleSection>
            </ContentWrapper>
        </MainContainer>
    );
};

export default App; 