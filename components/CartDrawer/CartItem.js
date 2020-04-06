import React from 'react';
import PropTypes from 'prop-types';
import Link from 'next/link';
import Router from 'next/router';
import { connect } from 'react-redux';
import { Typography, IconButton } from '@material-ui/core';
import ClearIcon from '@material-ui/icons/Clear';

import { removeFromCart, clearBuyItNow } from '../../store/actions';
import { CartItems, Thumb, ItemInfo } from '../../styles/CartDrawer';
import { StyledAnchorLink } from '../../styles/Shared';
import { awsBucket } from '../../config';

const CartItem = ({
  buyItNow,
  data,
  closeDrawer,
  clearBuyItNow: clearBytItNowRedux,
  removeFromCart: removeFromCartRedux
}) => {
  const handleRemove = id =>
    buyItNow ? clearBytItNowRedux() : removeFromCartRedux(id);

  const handleKeyDown = (href, as) => ({ key }) => {
    if (key === 'Enter') {
      Router.push(href, as);
    }
  };

  const getItemImage = item => {
    if (item && item.images && item.images.length) {
      return `${awsBucket}/photos/${item.images[0].thumb}`;
    }
    return '/static/images/fallback.png';
  };

  return (
    <CartItems>
      {data.map(item => (
        <li key={item._id}>
          <Link href={`/piece?slug=${item.slug}`} as={`/piece/${item.slug}`}>
            <a
              style={{ textDecoration: 'none', height: '48px' }}
              target="_self"
              onClick={closeDrawer}
              onKeyDown={handleKeyDown(
                `/piece?slug=${item.slug}`,
                `/piece/${item.slug}`
              )}
              role="link"
              tabIndex={0}
            >
              <Thumb src={getItemImage(item)} />
            </a>
          </Link>
          <ItemInfo>
            <Typography variant="body2">
              <Link
                href={`/piece?slug=${item.slug}`}
                as={`/piece/${item.slug}`}
              >
                <StyledAnchorLink
                  target="_self"
                  onClick={closeDrawer}
                  onKeyDown={handleKeyDown(
                    `/piece?slug=${item.slug}`,
                    `/piece/${item.slug}`
                  )}
                  role="link"
                  tabIndex={0}
                >
                  {item.name}
                </StyledAnchorLink>
              </Link>
              , £{item.price}
            </Typography>
            <Typography variant="body2" style={{ fontWeight: 300 }}>
              {item.ringSize}
              {item.silverFinishStyle && `, ${item.silverFinishStyle}`}
            </Typography>
          </ItemInfo>
          <IconButton
            style={{ color: 'rgba(0, 0, 0, 0.26)', marginLeft: '4px' }}
            aria-label="Remove item"
            onClick={() =>
              window.confirm('Are you sure you want to remove this item?') &&
              handleRemove(item._id)
            }
          >
            <ClearIcon fontSize="small" />
          </IconButton>
        </li>
      ))}
    </CartItems>
  );
};

const mapStateToProps = state => ({
  cart: state.cart,
  buyItNowItem: state.buyItNow
});

const mapDispatchToProps = dispatch => ({
  removeFromCart: id => dispatch(removeFromCart(id)),
  clearBuyItNow: () => dispatch(clearBuyItNow())
});

CartItem.propTypes = {
  data: PropTypes.array,
  buyItNow: PropTypes.bool,
  closeDrawer: PropTypes.func,
  removeFromCart: PropTypes.func,
  clearBuyItNow: PropTypes.func
};

export default connect(mapStateToProps, mapDispatchToProps)(CartItem);
