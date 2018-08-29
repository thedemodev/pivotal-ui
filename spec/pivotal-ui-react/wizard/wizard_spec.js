import '../spec_helper';
import {Wizard} from '../../../src/react/wizard';

describe('Wizard', () => {
  let finish, pages, subject, nextEnabled;

  beforeEach(() => {
    finish = jest.fn();
    nextEnabled = jest.fn();
    nextEnabled.and.returnValue(true);
    pages = [{
      render: jest.fn().and.returnValue((<div className="wizard-page-one">pageOne</div>)),
      nextEnabled
    }, {
      render: jest.fn().and.returnValue((<div className="wizard-page-two">pageTwo</div>))
    }];
    subject = shallow(<Wizard {...{finish, pages}}/>);
  });

  describe('#getPage', () => {
    beforeEach(() => {
      subject.state.currentPage = 5;
    });

    it('gets the page', () => {
      expect(subject.getPage()).toBe(5);
    });
  });

  describe('#setPage', () => {
    describe('valid page', () => {
      beforeEach(() => {
        subject.setPage(1);
      });

      it('gets the page', () => {
        expect(subject.state.currentPage).toBe(1);
      });
    });

    describe('invalid page (too low)', () => {
      beforeEach(() => {
        subject.setPage(-1);
      });

      it('gets the page', () => {
        expect(subject.state.currentPage).toBe(0);
      });
    });

    describe('invalid page (too high)', () => {
      beforeEach(() => {
        subject.setPage(5);
      });

      it('gets the page', () => {
        expect(subject.state.currentPage).toBe(1);
      });
    });
  });

  describe('#onClickCancel', () => {
    let cancel;

    beforeEach(() => {
      cancel = jest.fn();
      subject.setProps({cancel});
      subject.onClickCancel();
    });

    it('calls the cancel callback', () => {
      expect(cancel).toHaveBeenCalledWith();
    });
  });

  describe('#onClickBack', () => {
    beforeEach(() => {
      subject.state.currentPage = 1;
    });

    describe('without custom onClickBack', () => {
      beforeEach(() => {
        subject.onClickBack();
      });

      it('goes back one page', () => {
        expect(subject.state.currentPage).toBe(0);
      });
    });

    describe('with custom onClickBack', () => {
      let onClickBack;

      beforeEach(() => {
        onClickBack = jest.fn();
        onClickBack.and.returnValue(0);
        pages.push({
          render: jest.fn(),
          onClickBack
        });
        subject.setProps({pages});
        subject.setState({currentPage: 2});
        subject.onClickBack();
      });

      it('renders third page', () => {
        expect(pages[2].render).toHaveBeenCalledWith({
          onClickNext: subject.onClickNext,
          setPage: subject.setPage,
          getPage: subject.getPage
        });
      });

      it('calls onClickBack callback', () => {
        expect(onClickBack).toHaveBeenCalledWith();
      });

      it('goes back one page', () => {
        expect(subject.state.currentPage).toBe(0);
      });
    });

    describe('when "backComponent" is provided', () => {
      let onClickBack;

      beforeEach(() => {
        onClickBack = jest.fn();
        pages.push({
          render: jest.fn(),
          onClickBack,
          backComponent: <button className="some-back-button"/>
        });
        subject.setProps({pages});
        subject.setState({currentPage: 2});
      });

      it('renders the back component', () => {
        expect(subject.find('.wizard .wizard-footer .col:eq(0) .some-back-button').exists()).toBeTruthy();
      });

      it('does not render the back button', () => {
        expect(subject.find('.wizard-back-btn').exists()).toBeFalsy();
      });

      describe('when clicking the back component', () => {
        beforeEach(() => {
          $('.wizard .wizard-footer .col:eq(0) .some-back-button').simulate('click');
        });

        it('does not call the back callback', () => {
          expect(onClickBack).not.toHaveBeenCalled();
        });
      });
    });
  });

  describe('#onClickNext', () => {
    describe('without custom onClickNext', () => {
      beforeEach(() => {
        subject.onClickNext();
      });

      it('advances internal state to the next page', () => {
        expect(subject.state.currentPage).toBe(1);
      });
    });

    describe('with custom onClickNext', () => {
      let onClickNext;

      beforeEach(() => {
        onClickNext = jest.fn();
        pages.push({
          render: jest.fn(),
          onClickNext
        });
        pages.push({
          render: jest.fn()
        });
        subject.setProps({pages});
        subject.setState({currentPage: pages.length - 2});
        subject.onClickNext();
      });

      it('calls onClickNext callback', () => {
        expect(onClickNext).toHaveBeenCalledWith();
      });

      it('advances internal state to the next page', () => {
        expect(subject.state.currentPage).toBe(pages.length - 1);
      });

      it('renders the fourth page', () => {
        expect(pages[pages.length - 1].render).toHaveBeenCalledWith({
          onClickNext: subject.onClickNext,
          setPage: subject.setPage,
          getPage: subject.getPage
        });
      });
    });
  });

  describe('#onClickFinish', () => {
    beforeEach(() => {
      subject.setState({currentPage: 1});
      subject.onClickFinish();
    });

    it('calls the finish callback', () => {
      expect(finish).toHaveBeenCalledWith();
    });
  });

  describe('when on the first page', () => {
    it('renders the first page', () => {
      expect(pages[0].render).toHaveBeenCalledWith({
        onClickNext: subject.onClickNext,
        setPage: subject.setPage,
        getPage: subject.getPage
      });
      expect(subject.find('.wizard-page-one').exists()).toBeTruthy();
    });

    it('does not render a cancel button', () => {
      expect(subject.find('.wizard-cancel-btn').exists()).toBeFalsy();
    });

    describe('with cancel callback', () => {
      let cancel;

      beforeEach(() => {
        cancel = jest.fn();
        subject.setProps({cancel});
      });

      it('renders a cancel button', () => {
        expect(subject.find('.wizard-cancel-btn.pui-btn-primary-alt').text()).toBe('Cancel');
      });

      describe('with custom cancel text', () => {
        beforeEach(() => {
          subject.setProps({cancelText: 'Close'});
        });

        it('renders a cancel button with custom text', () => {
          expect(subject.find('.wizard-cancel-btn.pui-btn-primary-alt').text()).toBe('Close');
        });
      });
    });

    it('does not render a back button', () => {
      expect(subject.find('.wizard-back-btn').exists()).toBeFalsy();
    });

    it('renders a "next" PrimaryButton', () => {
      expect(subject.find('.wizard-next-btn.pui-btn-primary').text()).toBe('Next');
    });

    it('checks if the next button is enabled', () => {
      expect(pages[0].nextEnabled).toHaveBeenCalledWith(subject.getPage);
    });

    describe('when clicking the next button', () => {
      beforeEach(() => {
        $('.wizard-next-btn').simulate('click');
      });

      it('renders the next page', () => {
        expect(subject.find('.wizard-page-one').exists()).toBeFalsy();
        expect(subject.find('.wizard-page-two').exists()).toBeTruthy();
        expect(subject.state.currentPage).toEqual(1);
      });
    });

    describe('when hiding the "next" button', () => {
      beforeEach(() => {
        pages[0].hideNextButton = true;
        subject.forceUpdate();
      });

      it('does not render the next button', () => {
        expect(subject.find('.wizard-next-btn.pui-btn-primary').exists()).toBeFalsy();
      });
    });

    describe('with custom next text', () => {
      beforeEach(() => {
        pages[0].nextText = () => 'customNext';
        subject.forceUpdate();
      });

      it('renders the custom text', () => {
        expect(subject.find('.wizard-next-btn.pui-btn-primary').text()).toBe('customNext');
      });
    });

    describe('when the "enableNext" is false', () => {
      beforeEach(() => {
        nextEnabled.and.returnValue(false);
        subject.forceUpdate();
      });

      it('moving to the next page is disabled', () => {
        $('.wizard-next-btn').simulate('click');
        expect(subject.state.currentPage).toBe(0);
      });

      it('disables the "next" button', () => {
        expect(subject.find('.wizard-next-btn.pui-btn-primary').prop('disabled');
      });
    });
  });

  describe('when on the last page')).toBe(() => {
    beforeEach(() => {
      subject.setState({currentPage: pages.length - 1});
    });

    it('renders a "finish" PrimaryButton', () => {
      expect(subject.find('.wizard-finish-btn.pui-btn-primary').text()).toBe('Finish');
    });

    describe('when "hideFinishButton" is true', () => {
      beforeEach(() => {
        const lastPage = pages[pages.length - 1];
        pages[pages.length - 1] = {...lastPage, hideFinishButton: true};
        subject.forceUpdate();
      });

      it('does not render a "finish" Button', () => {
        expect(subject.find('.wizard-finish-btn').exists()).toBeFalsy();
      });
    });

    describe('when "hideBackButton" is true', () => {
      beforeEach(() => {
        const lastPage = pages[pages.length - 1];
        pages[pages.length - 1] = {...lastPage, hideBackButton: true};
        subject.forceUpdate();
      });

      it('does not render a "back" Button', () => {
        expect(subject.find('.wizard-back-btn').exists()).toBeFalsy();
      });
    });

    it('does not render a "next" PrimaryButton', () => {
      expect(subject.find('.wizard-next-btn.pui-btn-primary').exists()).toBeFalsy();
    });

    it('renders a "back" alt PrimaryButton', () => {
      expect(subject.find('.wizard-back-btn.pui-btn-primary-alt').text()).toBe('Back');
    });

    describe('when clicking the "back" button', () => {
      beforeEach(() => {
        $('.wizard-back-btn').simulate('click');
      });

      it('renders the previous page', () => {
        expect(subject.find('.wizard-page-one').exists()).toBeTruthy();
        expect(subject.find('.wizard-page-two').exists()).toBeFalsy();
        expect(subject.state.currentPage).toEqual(0);
      });
    });

    describe('with custom finish text', () => {
      beforeEach(() => {
        subject.setProps({finishText: 'customFinish'});
      });

      it('renders the custom text', () => {
        expect(subject.find('.wizard-finish-btn.pui-btn-primary').text()).toBe('customFinish');
      });
    });

    describe('when finish button is clicked', () => {
      let finish;

      beforeEach(() => {
        finish = jest.fn();
        subject.setProps({
          finish
        });
        $('.wizard-finish-btn').simulate('click');
      });

      it('calls custom finish function', () => {
        expect(finish).toHaveBeenCalledWith();
      });
    });

    describe('when "saving" is true and savingText is provided', () => {
      beforeEach(() => {
        subject.setProps({saving: true, savingText: 'Creating'});
      });

      it('renders a spinner', () => {
        expect(subject.find('.wizard-finish-btn .icon-spinner-sm').exists()).toBeTruthy();
      });

      it('changes the button text to savingText', () => {
        expect('.wizard-finish-btn').toContainText('Creating');
      });

      it('disables the back button', () => {
        expect(subject.find('.wizard-back-btn').prop('disabled');
      });
    });

    describe('when "saving" is true and savingText is not provided')).toBe(() => {
      beforeEach(() => {
        subject.setProps({saving: true});
      });

      it('changes the button text to the default saving text', () => {
        expect('.wizard-finish-btn').toContainText('Saving');
      });
    });

    describe('when "saving" is false', () => {
      it('does not render a spinner', () => {
        expect(subject.find('.wizard-finish-btn .icon-spinner-sm').exists()).toBeFalsy();
      });

      it('does not change the button text', () => {
        expect('.wizard-finish-btn').toContainText('Finish');
      });

      it('does not disable the back button', () => {
        expect('.wizard-back-btn').not.toHaveAttr('disabled');
      });
    });

    describe('when "finishComponent" is provided', () => {
      beforeEach(() => {
        pages[pages.length - 1].finishComponent = <button className="some-custom-button"/>;
        subject.forceUpdate();
      });

      it('renders the finish component', () => {
        expect(subject.find('.wizard .wizard-footer .col:eq(1) .some-custom-button').exists()).toBeTruthy();
      });

      it('does not render the finish button', () => {
        expect(subject.find('.wizard-finish-btn').exists()).toBeFalsy();
      });

      describe('when clicking the finish component', () => {
        beforeEach(() => {
          $('.wizard .wizard-footer .col:eq(1) .some-custom-button').simulate('click');
        });

        it('does not call the finish callback', () => {
          expect(finish).not.toHaveBeenCalled();
        });
      });
    });
  });
});