import React from 'react';
import PropTypes from 'prop-types';
import { Grid, Button, ButtonBase, Typography } from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import { connect } from 'react-redux';
import Link from 'next/link';
import axios from 'axios';

import { increaseLoadedItems } from '../../store/actions';
import Filter from './Filter';
import { ITEMS_PER_PAGE, appUrl } from '../../config';
import {
  FilterWrapper,
  FlexContainer,
  ButtonIndicator
} from '../../styles/Gallery';
import ModalLoader from '../UI/ModalLoader/ModalLoader';

const styles = () => ({
  root: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    paddingTop: '10px',
    '@media (min-width: 1460px)': { margin: '0 -80px' }
  },
  grid: {
    marginTop: '20px'
  },
  buttonContainer: {
    textAlign: 'center',
    marginBottom: '20px',
    '@media (min-width: 960px)': {
      paddingBottom: '40px',
      paddingTop: '20px'
    }
  },
  collection: {
    lineHeight: '48px',
    textTransform: 'uppercase'
  },
  gridWrapper: {
    margin: 0,
    width: '100%'
  },
  gridItem: {
    display: 'flex',
    justifyContent: 'center'
  },
  image: {
    width: '100%'
  },
  buttonBase: {
    flexDirection: 'column'
  },
  light: {
    fontWeight: 300
  },
  swapButton: {
    display: 'inline-block'
  }
});

class Gallery extends React.Component {
  constructor(props) {
    super(props);
    const { data, collectionsNames, reduxLoadedItems } = props;
    const collections = {
      all: { data, itemsLoaded: reduxLoadedItems.all }
    };

    const dataForSelectedCollection = (allItemsData, collection) =>
      allItemsData.filter(x => x.group === collection);

    collectionsNames.forEach(collection => {
      collections[collection] = {
        data: dataForSelectedCollection(data, collection),
        itemsLoaded: reduxLoadedItems[collection] || ITEMS_PER_PAGE
      };
    });

    this.state = {
      collections: { ...collections },
      withFilter: {},
      toSwap: {},
      snapshots: {},
      updating: false
    };
  }

  componentDidMount() {
    const {
      toSwap: { collection }
    } = this.state;
    const { user, showCollection } = this.props;
    if (user && collection && showCollection !== collection) {
      this.setState({ snapshots: {}, toSwap: {} });
    }
  }

  loadMore = collection => {
    const { increaseLoadedItems: increaseLoadedItemsRedux } = this.props;

    increaseLoadedItemsRedux(collection);

    this.setState(prevState => ({
      collections: {
        ...prevState.collections,
        [collection]: {
          data: prevState.collections[collection].data,
          itemsLoaded:
            prevState.collections[collection].itemsLoaded + ITEMS_PER_PAGE
        }
      }
    }));
  };

  handleChange = value => {
    const { showCollection } = this.props;

    this.setState({
      withFilter: {
        [showCollection]: { filter: value, category: value }
      }
    });
  };

  onCardMediaError = e => {
    const fallbackImage = '../../static/images/fallback.png';

    if (e.target.src.indexOf('/static/images/fallback.png') === -1) {
      e.target.src = fallbackImage;
    }
  };

  swapItemsIndexes = (itemId, collection) => {
    const {
      toSwap,
      collections: {
        [collection]: { data }
      }
    } = this.state;
    const location = collection === 'all' ? 'galleryIndex' : 'collectionIndex';

    const firstIndex = data.findIndex(el => el._id === itemId);
    const secondIndex = data.findIndex(el => el._id === toSwap.id);

    // intended state mutation
    const temp = data[secondIndex][location];
    data[secondIndex][location] = data[firstIndex][location];
    data[firstIndex][location] = temp;

    return data;
  };

  makeSnapshot = collection => {
    const {
      collections: {
        [collection]: { data: snapshot }
      }
    } = this.state;

    const index = collection === 'all' ? 'galleryIndex' : 'collectionIndex';
    const snapshotToSave = snapshot.map(item => ({
      _id: item._id,
      [index]: item[index]
    }));
    this.setState(prevState => ({
      snapshots: { ...prevState.snapshots, [collection]: snapshotToSave }
    }));
  };

  swap = item => {
    const { showCollection } = this.props;
    const { toSwap, snapshots } = this.state;

    if (!snapshots[showCollection]) {
      this.makeSnapshot(showCollection);
    }
    if (!toSwap.id) {
      return this.setState({
        toSwap: { id: item._id, collection: showCollection }
      });
    }
    if (toSwap.id === item._id) {
      return this.setState(prevState => ({
        toSwap: { ...prevState.toSwap, id: null }
      }));
    }

    this.swapItemsIndexes(item._id, showCollection);

    return this.setState(prevState => ({
      toSwap: { ...prevState.toSwap, id: null }
    }));
  };

  saveGallery = () => {
    const { showCollection } = this.props;
    const {
      snapshots: { [showCollection]: activeSnapshot },
      collections: {
        [showCollection]: { data }
      }
    } = this.state;

    if (!activeSnapshot) return;

    const activeIndex =
      showCollection === 'all' ? 'galleryIndex' : 'collectionIndex';

    const filtered = data.filter(item => {
      const snapIndex = activeSnapshot.findIndex(e => e._id === item._id);
      if (
        activeSnapshot[snapIndex]._id === item._id &&
        activeSnapshot[snapIndex][activeIndex] !== item[activeIndex]
      ) {
        return true;
      }
      return false;
    });

    if (filtered.length > 0) {
      this.setState({ updating: true });

      axios
        .post(`${appUrl}/api/update-grid`, {
          data: filtered,
          index: activeIndex
        })
        .then(res => {
          this.makeSnapshot(showCollection);
          this.setState({
            updating: false
          });
        })
        .catch(err => {
          console.log(err);
          this.setState({
            updating: false
          });
        });
    }
  };

  sort = dataArray => {
    const { showCollection } = this.props;
    const indexValue =
      showCollection === 'all' ? 'galleryIndex' : 'collectionIndex';
    const sorted = dataArray.sort((a, b) => {
      if (a[indexValue] > b[indexValue]) return 1;
      return -1;
    });
    return sorted;
  };

  render() {
    const { classes, data, showCollection, showFilter, user } = this.props;
    const { withFilter, collections, updating, toSwap } = this.state;

    if (data.length < 1) {
      return (
        <Typography variant="body2" align="center">
          Gallery empty.
        </Typography>
      );
    }

    const { itemsLoaded } = collections[showCollection];

    const originalData = collections[showCollection].data;

    const sorted = this.sort(originalData);

    let filtered = sorted.slice(0, itemsLoaded);
    let loadMoreButton = null;

    if (
      Object.prototype.hasOwnProperty.call(withFilter, showCollection) &&
      withFilter[showCollection].filter
    ) {
      filtered = sorted.filter(
        item => item.category === withFilter[showCollection].category
      );
    } else if (sorted.length > itemsLoaded) {
      loadMoreButton = (
        <div className={classes.buttonContainer}>
          <Button
            size="medium"
            variant="contained"
            color="secondary"
            onClick={() => this.loadMore(showCollection)}
          >
            Load More
          </Button>
        </div>
      );
    }

    let filter = null;
    if (showFilter) {
      filter = (
        <FilterWrapper>
          <Filter
            collection={showCollection}
            data={sorted}
            handleChange={this.handleChange}
            option={
              Object.prototype.hasOwnProperty.call(withFilter, showCollection)
                ? withFilter[showCollection].category
                : ''
            }
          />
        </FilterWrapper>
      );
    }

    return (
      <div>
        {filter}
        {updating && <ModalLoader />}
        <div className={classes.root}>
          {user && (
            <Button
              onClick={this.saveGallery}
              size="small"
              variant="contained"
              color="primary"
            >
              Save gallery item's position
            </Button>
          )}
          <Grid container spacing={32} className={classes.gridWrapper}>
            {filtered.map(item => (
              <Grid
                item
                xs={12}
                sm={6}
                md={4}
                key={item._id}
                className={classes.gridItem}
              >
                <FlexContainer>
                  {user && (
                    <ButtonIndicator
                      activeSwap={toSwap.id === item._id}
                      swapWithMe={toSwap.id}
                    >
                      {item.available ? (
                        <Typography
                          variant="body2"
                          align="center"
                          style={{ color: 'green' }}
                        >
                          Available to buy
                        </Typography>
                      ) : (
                        <Typography
                          variant="body2"
                          align="center"
                          style={{ color: 'red' }}
                        >
                          NOT available to buy
                        </Typography>
                      )}
                      <Button
                        onClick={() => this.swap(item)}
                        className={classes.swapButton}
                        fullWidth
                      >
                        {toSwap.id === item._id ? 'REMOVE ACTION' : 'SWAP'}
                      </Button>
                    </ButtonIndicator>
                  )}
                  <Link
                    href={`/piece?id=${item._id}`}
                    as={`/piece/${item._id}`}
                  >
                    <ButtonBase classes={{ root: classes.buttonBase }}>
                      <img
                        src={`/static/uploads/${item.frontImage}`}
                        alt={item.description}
                        className={classes.image}
                        onError={e => this.onCardMediaError(e)}
                      />
                      <Typography component="span">{item.name}</Typography>
                      <Typography component="span" className={classes.light}>
                        £{item.price.toFixed(2)}
                      </Typography>
                    </ButtonBase>
                  </Link>
                </FlexContainer>
              </Grid>
            ))}
          </Grid>
          {loadMoreButton}
        </div>
      </div>
    );
  }
}

Gallery.propTypes = {
  data: PropTypes.arrayOf(PropTypes.object),
  showCollection: PropTypes.string,
  classes: PropTypes.object,
  collectionsNames: PropTypes.arrayOf(PropTypes.string),
  reduxLoadedItems: PropTypes.object,
  increaseLoadedItems: PropTypes.func,
  showFilter: PropTypes.bool,
  user: PropTypes.string
};

const mapStateToProps = state => ({
  reduxLoadedItems: state.loadMore
});

const mapDispatchToProps = dispatch => ({
  increaseLoadedItems: collection => dispatch(increaseLoadedItems(collection))
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(withStyles(styles)(Gallery));
