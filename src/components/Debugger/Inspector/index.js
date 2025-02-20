import './styles.css'
import { Component } from 'inferno'

import {
  isObject,
  isArray,
  isString,
  isBoolean,
  isNumber,
  isNull,
} from '../../../common/utils'
import JSONInput from './JSONInput'

function isInPath(source, target) {
  if (!source || !target) {
    return false
  }
  return target.reduce((isInPath, key, index) => {
    if (!isInPath) {
      return false
    }
    return String(source[index]) === String(key)
  }, true)
}

function isInExpandedPath(expandedPaths, path) {
  if (!expandedPaths || !path) {
    return false
  }
  const pathIndex = expandedPaths.indexOf(path.join('.'))
  return pathIndex > -1
}

function renderType(
  value,
  hasNext,
  path,
  propertyKey,
  highlightPath,
  modelChanged,
  pathClicked,
  expandedPaths
) {
  if (value === undefined) {
    return null
  }

  if (isArray(value)) {
    return (
      <ArrayValue
        value={value}
        hasNext={hasNext}
        modelChanged={modelChanged}
        path={path}
        pathClicked={pathClicked}
        propertyKey={propertyKey}
        highlightPath={highlightPath}
        expandedPaths={expandedPaths}
      />
    )
  }
  if (isObject(value)) {
    return (
      <ObjectValue
        value={value}
        hasNext={hasNext}
        modelChanged={modelChanged}
        path={path}
        pathClicked={pathClicked}
        propertyKey={propertyKey}
        highlightPath={highlightPath}
        expandedPaths={expandedPaths}
      />
    )
  }

  return (
    <Value
      value={value}
      hasNext={hasNext}
      path={path}
      pathClicked={pathClicked}
      modelChanged={modelChanged}
      propertyKey={propertyKey}
      highlightPath={highlightPath}
      expandedPaths={expandedPaths}
    />
  )
}

class ObjectValue extends Component {
  constructor(props, context) {
    super(props)
    const isHighlightPath = !!(
      this.props.highlightPath &&
      isInPath(this.props.highlightPath, this.props.path)
    )
    const isExpanded =
      this.props.expandedPaths &&
      isInExpandedPath(this.props.expandedPaths, this.props.path)
    const preventCollapse =
      this.props.path.length === 0 && context.options.expanded

    this.state = {
      isCollapsed: !preventCollapse && !isHighlightPath && !isExpanded,
    }

    this.onCollapseClick = this.onCollapseClick.bind(this)
    this.onExpandClick = this.onExpandClick.bind(this)
  }
  componentWillReceiveProps(nextProps) {
    const context = this.context
    const props = nextProps
    const isHighlightPath = !!(
      props.highlightPath && isInPath(props.highlightPath, props.path)
    )
    const isExpanded =
      props.expandedPaths && isInExpandedPath(props.expandedPaths, props.path)
    const preventCollapse = props.path.length === 0 && context.options.expanded

    if (this.state.isCollapsed) {
      this.setState({
        isCollapsed: !preventCollapse && !isHighlightPath && !isExpanded,
      })
    }
  }
  componentDidUpdate(prevProps) {
    if (String(this.props.highlightPath) === String(this.props.path)) {
      document.querySelector('#model').scrollTop = this.node.offsetTop - 100
    }
  }
  onExpandClick(event) {
    event.stopPropagation()
    this.setState({ isCollapsed: false })
    this.props.pathClicked({ path: this.props.path, expanded: true })
    if (!this.props.path.length && this.context.options.onExpand) {
      this.context.options.onExpand()
    }
  }
  onCollapseClick(event) {
    event.stopPropagation()
    this.setState({ isCollapsed: true })
    this.props.pathClicked({ path: this.props.path, expanded: false })
    if (!this.props.path.length && this.context.options.onCollapse) {
      this.context.options.onCollapse()
    }
  }
  renderProperty(key, value, index, hasNext, path) {
    this.props.path.push(key)
    const property = (
      <div className="inspector-objectProperty" key={index}>
        <div className="inspector-objectPropertyValue">
          {renderType(
            value,
            hasNext,
            path.slice(),
            key,
            this.props.highlightPath,
            this.props.modelChanged,
            this.props.pathClicked,
            this.props.expandedPaths
          )}
        </div>
      </div>
    )
    this.props.path.pop()
    return property
  }
  renderKeys(keys) {
    if (keys.length > 3) {
      return keys.slice(0, 3).join(', ') + '...'
    }
    return keys.join(', ')
  }
  render() {
    const { value, hasNext } = this.props
    const isExactHighlightPath =
      this.props.highlightPath &&
      String(this.props.highlightPath) === String(this.props.path)

    if (this.state.isCollapsed) {
      return (
        <div
          ref={node => {
            this.node = node
          }}
          className={
            isExactHighlightPath
              ? 'inspector-object inspector-highlight'
              : 'inspector-object'
          }
          onClick={this.onExpandClick}
        >
          {this.props.propertyKey ? this.props.propertyKey + ': ' : null}
          <strong>{'{ '}</strong>
          {this.renderKeys(Object.keys(value))}
          <strong>{' }'}</strong>
          {hasNext ? ',' : null}
        </div>
      )
    } else if (this.props.propertyKey) {
      const keys = Object.keys(value)
      return (
        <div
          ref={node => {
            this.node = node
          }}
          className={
            isExactHighlightPath
              ? 'inspector-object inspector-highlight'
              : 'inspector-object'
          }
        >
          <div onClick={this.onCollapseClick}>
            {this.props.propertyKey}: <strong>{'{ '}</strong>
          </div>
          {keys.map((key, index) =>
            this.renderProperty(
              key,
              value[key],
              index,
              index < keys.length - 1,
              this.props.path
            )
          )}
          <div>
            <strong>{' }'}</strong>
            {hasNext ? ',' : null}
          </div>
        </div>
      )
    } else {
      const keys = Object.keys(value)
      return (
        <div
          ref={node => {
            this.node = node
          }}
          className={
            isExactHighlightPath
              ? 'inspector-object inspector-highlight'
              : 'inspector-object'
          }
        >
          <div onClick={this.onCollapseClick}>
            <strong>{'{ '}</strong>
          </div>
          {keys.map((key, index) =>
            this.renderProperty(
              key,
              value[key],
              index,
              index < keys.length - 1,
              this.props.path,
              this.props.highlightPath
            )
          )}
          <div>
            <strong>{' }'}</strong>
            {hasNext ? ',' : null}
          </div>
        </div>
      )
    }
  }
}

class ArrayValue extends Component {
  constructor(props) {
    super(props)
    const isHighlightPath =
      this.props.highlightPath &&
      isInPath(this.props.highlightPath, this.props.path)
    const isExpanded =
      this.props.expandedPaths &&
      isInExpandedPath(this.props.expandedPaths, this.props.path)
    this.state = {
      isCollapsed: !isHighlightPath && !isExpanded,
    }
    this.onCollapseClick = this.onCollapseClick.bind(this)
    this.onExpandClick = this.onExpandClick.bind(this)
  }
  componentWillReceiveProps(nextProps) {
    const props = nextProps
    const isHighlightPath =
      props.highlightPath && isInPath(props.highlightPath, props.path)
    const isExpanded =
      props.expandedPaths && isInExpandedPath(props.expandedPaths, props.path)
    if (this.state.isCollapsed) {
      this.setState({
        isCollapsed: !isHighlightPath && !isExpanded,
      })
    }
  }
  componentDidUpdate() {
    if (String(this.props.highlightPath) === String(this.props.path)) {
      document.querySelector('#model').scrollTop = this.node.offsetTop - 100
    }
  }
  onExpandClick(event) {
    event.stopPropagation()
    this.setState({ isCollapsed: false })
    this.props.pathClicked({ path: this.props.path, expanded: true })
  }
  onCollapseClick(event) {
    event.stopPropagation()
    this.setState({ isCollapsed: true })
    this.props.pathClicked({ path: this.props.path, expanded: false })
  }
  renderItem(item, index, hasNext, path) {
    this.props.path.push(index)
    const arrayItem = (
      <div className="inspector-arrayItem" key={index}>
        {renderType(
          item,
          hasNext,
          path.slice(),
          null,
          this.props.highlightPath,
          this.props.modelChanged,
          this.props.pathClicked,
          this.props.expandedPaths
        )}
      </div>
    )
    this.props.path.pop()
    return arrayItem
  }
  render() {
    const { value, hasNext } = this.props
    const isExactHighlightPath =
      this.props.highlightPath &&
      String(this.props.highlightPath) === String(this.props.path)

    if (this.state.isCollapsed) {
      return (
        <div
          className={
            isExactHighlightPath
              ? 'inspector-array inspector-highlight'
              : 'inspector-array'
          }
          onClick={this.onExpandClick}
        >
          {this.props.propertyKey ? this.props.propertyKey + ': ' : null}
          <strong>{'[ '}</strong>
          {value.length}
          <strong>{' ]'}</strong>
          {hasNext ? ',' : null}
        </div>
      )
    } else if (this.props.propertyKey) {
      return (
        <div
          ref={node => {
            this.node = node
          }}
          className={
            isExactHighlightPath
              ? 'inspector-array inspector-highlight'
              : 'inspector-array'
          }
        >
          <div onClick={this.onCollapseClick}>
            {this.props.propertyKey}: <strong>{'[ '}</strong>
          </div>
          {value.map((item, index) =>
            this.renderItem(
              item,
              index,
              index < value.length - 1,
              this.props.path
            )
          )}
          <div>
            <strong>{' ]'}</strong>
            {hasNext ? ',' : null}
          </div>
        </div>
      )
    } else {
      return (
        <div
          ref={node => {
            this.node = node
          }}
          className={
            isExactHighlightPath
              ? 'inspector-array inspector-highlight'
              : 'inspector-array'
          }
        >
          <div onClick={this.onCollapseClick}>
            <strong>{'[ '}</strong>
          </div>
          {value.map((item, index) =>
            this.renderItem(
              item,
              index,
              index < value.length - 1,
              this.props.path
            )
          )}
          <div>
            <strong>{' ]'}</strong>
            {hasNext ? ',' : null}
          </div>
        </div>
      )
    }
  }
}

class Value extends Component {
  constructor(props) {
    super(props)
    this.state = {
      isEditing: false,
      path: props.path.slice(),
      forceShowString: false,
    }

    this.onSubmit = this.onSubmit.bind(this)
    this.onBlur = this.onBlur.bind(this)
    this.onClick = this.onClick.bind(this)
    this.onMouseOver = this.onMouseOver.bind(this)
    this.onMouseLeave = this.onMouseLeave.bind(this)
  }
  componentDidUpdate() {
    if (String(this.props.highlightPath) === String(this.props.path)) {
      document.querySelector('#model').scrollTop = this.node.offsetTop - 100
    }
  }
  onClick() {
    this.setState({
      isEditing: !!this.context.options.canEdit,
    })
  }
  onMouseOver() {
    this.setState({
      forceShowString: true,
    })
  }
  onMouseLeave() {
    this.setState({
      forceShowString: false,
    })
  }
  onSubmit(value) {
    this.props.modelChanged({
      path: this.state.path,
      value,
    })
    this.setState({ isEditing: false })
  }
  onBlur() {
    this.setState({ isEditing: false })
  }
  shortenString(string) {
    if (!this.state.forceShowString && string.length > 50) {
      return string.substr(0, 47) + '...'
    }

    return string
  }
  renderValue(value, hasNext) {
    const isExactHighlightPath =
      this.props.highlightPath &&
      String(this.props.highlightPath) === String(this.props.path)

    if (this.state.isEditing) {
      return (
        <div className={isExactHighlightPath ? 'inspector-highlight' : null}>
          {this.props.propertyKey ? this.props.propertyKey + ': ' : <span />}
          <span>
            <JSONInput
              value={value}
              onBlur={this.onBlur}
              onSubmit={this.onSubmit}
            />
          </span>
          {hasNext ? ',' : null}
        </div>
      )
    } else {
      return (
        <div
          className={isExactHighlightPath ? 'inspector-highlight' : null}
          onMouseOver={this.onMouseOver}
          onMouseLeave={this.onMouseLeave}
        >
          {this.props.propertyKey ? this.props.propertyKey + ': ' : <span />}
          <span onClick={this.onClick}>
            {isString(value)
              ? '"' + this.shortenString(value) + '"'
              : String(value)}
          </span>
          {hasNext && ','}
        </div>
      )
    }
  }
  render() {
    let className = 'inspector-string'
    if (isNumber(this.props.value)) className = 'inspector-number'
    if (isBoolean(this.props.value)) className = 'inspector-boolean'
    if (isNull(this.props.value)) className = 'inspector-null'
    return (
      <div
        ref={node => {
          this.node = node
        }}
        className={className}
      >
        {this.renderValue(this.props.value, this.props.hasNext)}
      </div>
    )
  }
}

class Inspector extends Component {
  getChildContext() {
    return {
      options: {
        onExpand: this.props.onExpand,
        onCollapse: this.props.onCollapse,
        expanded: this.props.expanded || false,
        canEdit: this.props.canEdit || false,
      },
    }
  }
  render() {
    return renderType(
      this.props.value,
      false,
      [],
      null,
      this.props.path,
      this.props.modelChanged,
      this.props.pathClicked,
      this.props.expandedPaths
    )
  }
}

export default Inspector
