import * as React from 'react';
import * as ReactDOM from 'react-dom';
import DDLogic from './DDLogic';
import { Point, Rect } from './Geometry';
import './DDFloatingItem.css';

export interface DDFloatingItemProps {
  logic: DDLogic;
  draggedId: number;
  width: number;
  height: number;
  children: any;
}

export interface DDFloatingItemState {
  offsetX: number;
  offsetY: number;
}

class DDFloatingItemComponent extends React.Component<DDFloatingItemProps, DDFloatingItemState> {

  readonly state: DDFloatingItemState = { offsetX: 0, offsetY: 0 };

  componentDidMount() {
    this.props.logic.setFloatingItemBoxRect(this.getBox());
    this.props.logic.onDragMoveSignal.addListener(this.refresh);
  }

  componentDidUpdate() {
    this.props.logic.setFloatingItemBoxRect(this.getBox());
  }
  componentWillUnmount() {
    this.props.logic.onDragMoveSignal.removeListener(this.refresh);
  }

  refresh = (id: number, offset: Point) => {
    this.setState({ offsetX: offset.x, offsetY: offset.y });
  }

  render() {
    // console.log('DDFloatingItemComponent.render');
    if (this.props.draggedId >= -1) {
      return (
        <div
          className="dl-item floating"
          style={{
            pointerEvents: 'none',
            position: 'absolute',
            left: this.state.offsetX,
            top: this.state.offsetY,
            width: this.props.width,
            height: this.props.height
          }}
        >
          {this.props.children}
        </div>
      );
    } else {
      return undefined;
    }
  }

  private getBox(): Rect {
    const ref = ReactDOM.findDOMNode(this) as Element;
    return ref ? ref.getBoundingClientRect() : { top: 0, left: 0, width: 0, height: 0 };
  }

}

export default DDFloatingItemComponent;
