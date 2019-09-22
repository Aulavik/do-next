import styled from 'styled-components';

export const Wrapper = styled.div`
  max-width: 100%;
  min-height: 252px;
  margin: 6em auto 1em auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-image: url('/static/images/bg2.JPG');
  background-color: #eeeeee;
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;

  @media (min-width: 960px) {
    margin: 10em auto 6em auto;
  }
`;
Wrapper.displayName = 'Wrapper';

export const Form = styled.form`
  display: flex;
  align-items: center;
  flex-direction: column;
`;
Form.displayName = 'Form';

export const Wrap = styled.div`
  display: flex;
`;
Wrap.displayName = 'Wrap';
