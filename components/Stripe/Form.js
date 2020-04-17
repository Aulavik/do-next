/* eslint-disable camelcase */
import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Typography, Paper, Grid } from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import axios from 'axios';

import { clearCart, clearBuyItNow } from '../../store/actions';
import CartDrawerContent from '../CartDrawer/CartDrawerContent';
import Error from '../Error/Error';
import AdditionalInfoField from './AdditionalInfoField';
import CustomerOrderDetailForm from './CustomerOrderDetailForm';
import StripeDetailForm from './StripeDetailForm';
import PaymentFailureSegment from './PaymentFailureSegment';
import { attemptPayment } from './actions';
import { getPurchaseDetails, cartHelper } from '../../util/helpers';
import BuyButton from './BuyButton';
import ModalLoader from '../UI/ModalLoader/ModalLoader';
import * as gtag from '../../lib/gtag';
import {
  Wrapper,
  ShippmentForm,
  Cart,
  FormWrapper,
  CheckoutForm,
  CenterButton,
} from '../../styles/Checkout';

const styles = (theme) => ({
  paper: {
    backgroundColor: '#fafafa',
    marginTop: theme.spacing.unit * 3,
    marginBottom: theme.spacing.unit * 3,
    padding: theme.spacing.unit * 2,
    [theme.breakpoints.up(600 + theme.spacing.unit * 3 * 2)]: {
      marginTop: theme.spacing.unit * 6,
      marginBottom: theme.spacing.unit * 6,
      padding: theme.spacing.unit * 3,
    },
  },
  marginTop: {
    marginTop: '30px',
  },
});

class StripeForm extends Component {
  static propTypes = {
    buyItNowItem: PropTypes.object,
    cart: PropTypes.array,
    classes: PropTypes.object.isRequired,
    clearBuyItNow: PropTypes.func,
    clearCart: PropTypes.func,
    shippingCost: PropTypes.number,
    stripe: PropTypes.object,
    promo: PropTypes.object,
  };

  state = {
    orderComplete: false,
    error: false,
    processing: false,
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
    address1: '',
    address2: '',
    city: '',
    additional_info: '',
    country: 'GB',
    full_country_name: 'United Kingdom',
    card_number: { complete: false, error: null, empty: true },
    card_expiration: {
      complete: false,
      error: null,
      empty: true,
    },
    CVC_number: { complete: false, error: null, empty: true },
    postal_code: '',
    stripe_errors: false,
    backend_validation_errors: [],
    isClient: false,
  };

  componentDidMount() {
    this.setState({ isClient: true });
  }

  shouldComponentUpdate(nextProps, nextState) {
    const {
      first_name,
      last_name,
      email,
      phone,
      address1,
      address2,
      country,
      city,
      postal_code,
      additional_info,
    } = this.state;

    if (
      first_name !== nextState.first_name ||
      last_name !== nextState.last_name ||
      email !== nextState.email ||
      phone !== nextState.phone ||
      address1 !== nextState.address1 ||
      address2 !== nextState.address2 ||
      country !== nextState.country ||
      city !== nextState.city ||
      postal_code !== nextState.postal_code ||
      additional_info !== nextState.additional_info
    ) {
      return false;
    }
    return true;
  }

  handleChange = (name) => (event) => {
    if (name === 'country') {
      const full_country_name = [...event.target.options]
        .filter((option) => option.selected)
        .map((option) => option.textContent)[0];
      this.setState({ full_country_name });
    }
    this.setState({
      [name]: event.target.value,
    });
  };

  handleStripeChange = (element, name) => {
    if (!element.empty && element.complete) {
      return this.setState({
        [name]: { complete: true, error: null, empty: false },
      });
    }

    return this.setState({
      [name]: {
        complete: false,
        empty: element.empty,
        error: element.error ? element.error.message : null,
      },
    });
  };

  isStripesInputsOk = () => {
    const { card_number, card_expiration, CVC_number } = this.state;
    if (card_number.error || card_expiration.error || CVC_number.error) {
      this.setState({ stripe_errors: true });
      return false;
    }
    if (
      card_number.complete &&
      card_expiration.complete &&
      CVC_number.complete
    ) {
      this.setState(() => ({ stripe_errors: false }));
      return true;
    }

    // fields are left blank
    this.setState(() => ({ stripe_errors: true }));

    return false;
  };

  handleServerResponse = (response) => {
    const {
      clearCart: clearCartRedux,
      clearBuyItNow: clearBuyItNowRedux,
    } = this.props;

    if (response.data.errors) {
      // Show error from server on payment form
      window.scrollTo(0, 0);

      this.setState({
        backend_validation_errors: response.data.errors,
        processing: false,
      });
    } else if (response.data.requires_action) {
      // Use Stripe.js to handle required card action
      this.handleAction(response.data);
    } else {
      // Show success message
      this.setState(() => ({ orderComplete: true, processing: false }));
      clearCartRedux();
      clearBuyItNowRedux();
      window.scrollTo(0, 0);
    }
  };

  handleAction = (response) => {
    const { stripe, shippingCost, buyItNowItem, cart, promo } = this.props;
    const {
      first_name,
      last_name,
      email,
      phone,
      address1,
      address2,
      country,
      city,
      postal_code,
      full_country_name,
      additional_info,
    } = this.state;

    stripe
      .handleCardAction(response.payment_intent_client_secret)
      .then((result) => {
        if (result.error) {
          // Show error in payment form
          window.scrollTo(0, 0);

          this.setState({
            backend_validation_errors: [
              {
                msg: result.error.message,
                param: '_error',
              },
            ],
            processing: false,
          });
        } else {
          const purchaseDetails = getPurchaseDetails(
            buyItNowItem,
            shippingCost,
            cart,
            promo
          );
          // The card action has been handled
          // The PaymentIntent can be confirmed again on the server
          axios
            .post(`${process.env.APP_URL}/api/charge`, {
              payment_intent_id: result.paymentIntent.id,
              additional: {
                email,
                first_name,
                last_name,
                phone,
                address1,
                address2,
                city,
                additional_info,
                country,
                full_country_name,
                postal_code,
                purchaseDetails,
              },
            })
            .then((res) => {
              this.handleServerResponse(res);
            })
            .catch((err) => {
              console.log(err);
            });
        }
      });
  };

  handleSubmit = (ev) => {
    ev.preventDefault();

    gtag.event({
      action: 'submit_payment',
      category: 'Purchase',
      label: 'BUY_button',
    });

    const { stripe_errors } = this.state;
    const { stripe } = this.props;

    if (!this.isStripesInputsOk() || stripe_errors) return;
    this.setState(() => ({ processing: true }));

    if (stripe) {
      attemptPayment({ ...this.state, ...this.props })
        .then((res) => {
          this.handleServerResponse(res);
        })
        .catch((err) => {
          window.scrollTo(0, 0);
          this.setState({
            // actually error from stripe.js
            backend_validation_errors: [
              {
                msg:
                  'We cannot process your payment. Please check your payment details and try again.',
                param: '_error',
              },
            ],
            processing: false,
          });
        });
    } else {
      console.log('Form submitted before Stripe.js loaded.');
    }
  };

  isNotValid = (element) => {
    const { backend_validation_errors } = this.state;

    let output = null;

    if (backend_validation_errors.some((error) => error.param === element)) {
      output = backend_validation_errors
        .filter((error) => error.param === element)
        .map((error) => error.msg);
    }
    return output;
  };

  render() {
    const {
      backend_validation_errors,
      processing,
      isClient,
      orderComplete,
    } = this.state;

    const {
      cart,
      classes,
      stripe,
      buyItNowItem,
      shippingCost,
      promo,
    } = this.props;
    const buyItNow = Object.prototype.hasOwnProperty.call(buyItNowItem, 'name');

    const purchase = orderComplete ? (
      <p>Purchase Complete.</p>
    ) : (
      <CheckoutForm>
        <Paper className={classes.paper}>
          <FormWrapper>
            <form onSubmit={(e) => this.handleSubmit(e)}>
              {backend_validation_errors.length > 0
                ? backend_validation_errors
                    .filter((error) => error.param === '_error')
                    .map((error, i) => <Error key={i}>{error.msg}</Error>)
                : null}
              <Grid container spacing={16}>
                <CustomerOrderDetailForm
                  handleChange={this.handleChange}
                  isNotValid={this.isNotValid}
                  backend_validation_errors={backend_validation_errors}
                />
                <StripeDetailForm
                  data={this.state}
                  isNotValid={this.isNotValid}
                  handleChange={this.handleChange}
                  handleStripeChange={this.handleStripeChange}
                  backend_validation_errors={backend_validation_errors}
                />
                <Grid item xs={12}>
                  <AdditionalInfoField handleChange={this.handleChange} />
                </Grid>
              </Grid>
              <br />
              <CenterButton>
                <BuyButton
                  disabled={!stripe || processing}
                  fullWidth
                  priceToPay={cartHelper.priceToPay(
                    buyItNow,
                    buyItNowItem,
                    cart,
                    shippingCost,
                    promo.discount
                  )}
                />
              </CenterButton>
            </form>
          </FormWrapper>
        </Paper>
        {processing ? <ModalLoader /> : null}
      </CheckoutForm>
    );

    const { error } = this.state;
    if (error) {
      return (
        <>
          <PaymentFailureSegment />
          {processing ? <ModalLoader /> : null}
        </>
      );
    }

    const checkoutPossible = buyItNow || (isClient && cart.length > 0);
    if (checkoutPossible) {
      return (
        <Wrapper>
          <Cart>
            <CartDrawerContent inForm buyItNow={buyItNow} />
          </Cart>
          <ShippmentForm>{purchase}</ShippmentForm>
        </Wrapper>
      );
    }
    if (orderComplete) {
      return (
        <Typography variant="body2" className={classes.marginTop}>
          Your order was successful. Confirmation has been sent to your e-mail.
        </Typography>
      );
    }
    return (
      <div>
        <Typography variant="body2">Your Cart is empty.</Typography>
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  buyItNowItem: state.buyItNow,
  cart: state.cart,
  shippingCost: state.shippingCost,
  promo: state.promo,
});

const mapDispatchToProps = (dispatch) => ({
  clearBuyItNow: () => dispatch(clearBuyItNow()),
  clearCart: () => dispatch(clearCart()),
});

export default withStyles(styles)(
  connect(mapStateToProps, mapDispatchToProps)(StripeForm)
);