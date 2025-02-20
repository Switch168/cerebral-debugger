/* global Prism */
import './styles.css'
import { Component } from 'inferno'
import Inspector from '../../../Inspector'
import Mutation from './Mutation'
import Service from './Service'
import classnames from 'classnames'

function getActionName(action) {
  var regex = /\(([^()]+)\)/
  var match = regex.exec(action.name)

  return {
    name: match
      ? action.name.substr(0, match.index).trim()
      : action.name.trim(),
    params: match ? match[1] : null,
  }
}

function getLineNumber(error) {
  const variable =
    error.name === 'TypeError' && String(error.message).match(/'(.*?)'/)
      ? String(error.message).match(/'(.*?)'/)[1]
      : String(error.message).split(' ')[0]
  const lines = error.func.split('\n')

  return lines.reduce((lineNumber, line, index) => {
    if (lineNumber === -1 && line.indexOf(variable) >= 0) {
      return index + 2
    }
    return lineNumber
  }, -1)
}

function getOperatorName(actionName) {
  const operatorPath = actionName.params.split(',')[0].match(/`(.*)`/)[1]
  const nameArray = operatorPath
    .split(/(\${.*\})/)
    .map(path => {
      return path
        .replace('props`', 'props.')
        .replace('state`', 'state.')
        .replace(/`/, '')
    })
    .filter(path => path.length)
    .reduce((current, path) => {
      if (path.match(/\${.*\}/)) {
        return current.concat(path.replace('${', '[').replace('}', ']'))
      }

      return current.concat(path.split('.').filter(part => part.length))
    }, [])
  const exactArray = nameArray
    .reverse()
    .slice(0, 2)
    .reverse()
    .map(part => part[0].toUpperCase() + part.substr(1))

  return {
    name: `${actionName.name}${exactArray.join('')}`,
  }
}

function renderActionTitle(action, showOperatorName) {
  let actionName = getActionName(action)

  if (showOperatorName && actionName.name.indexOf('operator.') === 0) {
    actionName = getOperatorName(actionName)
  }

  return (
    <div className="action-actionTitle">
      <span className="action-actionName">{actionName.name}</span>
      {actionName.params ? (
        <span className="action-actionNameParams">{actionName.params}</span>
      ) : null}
    </div>
  )
}

function renderDetails(execution, isExpanded) {
  const hasMutation =
    execution &&
    execution.data.filter(data => Boolean(data) && data.type === 'mutation')
      .length
  const hasService =
    execution &&
    execution.data.filter(data => Boolean(data) && data.type !== 'mutation')
      .length
  const hasOutput = execution && execution.output

  return (
    <div className="action-actionDetails">
      {hasMutation ? (
        <span className="action-hasMutation">mutation</span>
      ) : null}
      {hasService ? <span className="action-hasService">provider</span> : null}
      {hasOutput ? <span className="action-hasOutput">output</span> : null}
      <span className={`icon icon-${isExpanded ? 'up' : 'down'} `} />
    </div>
  )
}

function renderCode(error) {
  return error.func
    .split('\n')
    .map(line => line.replace(/\t/, ''))
    .join('\n')
}

class Action extends Component {
  constructor(props) {
    super(props)
    this.isHighlighted = false
  }
  componentDidMount() {
    if (this.errorElement) {
      Prism.highlightElement(this.errorElement)
      this.isHighlighted = true
    }
  }
  componentDidUpdate() {
    // Inferno hack, this triggers too early
    setTimeout(() => {
      if (this.errorElement && !this.isHighlighted) {
        Prism.highlightElement(this.errorElement)
        this.isHighlighted = true
      }
    })
  }
  render() {
    const {
      action,
      output,
      actionToggled,
      isExpanded,
      faded,
      execution,
      children,
      onMutationClick,
      executed,
      pathClicked,
    } = this.props

    const error = execution && execution.error
    const titleClassname = classnames({
      'action-actionErrorHeader': error,
      'action-actionHeader': !error,
      'action-faded': faded,
    })

    if (error) {
      return (
        <div
          className="action action-actionError"
          onClick={event => event.stopPropagation()}
        >
          <div className={titleClassname}>
            <i className="icon icon-warning" />
            {action.isAsync && <i className="icon icon-asyncAction" />}
            {renderActionTitle(action)}
          </div>
          <div className="action-error">
            <div className="action-error-message">
              <strong>{error.name}:</strong>{' '}
              <Inspector value={error} pathClicked={pathClicked} />
            </div>
            <pre data-line={getLineNumber(error) || null}>
              <code
                ref={node => {
                  this.errorElement = node
                }}
                className="language-javascript"
                dangerouslySetInnerHTML={{ __html: renderCode(error) }}
              />
            </pre>
            <div>
              <strong>Stack:</strong>
              <pre style={{ overflowX: 'scroll' }}>{error.stack}</pre>
            </div>
            {executed}
          </div>
        </div>
      )
    }

    if (isExpanded) {
      return (
        <div
          className="action action-expanded"
          onClick={event => {
            event.stopPropagation()
            actionToggled()
          }}
        >
          <div className="action-titleContainer">
            <div className={titleClassname}>
              {action.isAsync && <i className="icon icon-asyncAction" />}
              {renderActionTitle(action, this.props.showOperatorName)}
            </div>
            {renderDetails(execution, isExpanded)}
          </div>
          {execution ? (
            <div>
              <div className={faded ? 'action-faded' : null}>
                <div className="action-mutations">
                  {execution.data
                    .filter(data => Boolean(data))
                    .map(
                      (data, index) =>
                        data.type === 'mutation' ? (
                          <Mutation
                            mutation={data}
                            key={index}
                            onMutationClick={onMutationClick}
                            pathClicked={pathClicked}
                          />
                        ) : (
                          <Service
                            showReturnValue={this.props.showProviderReturnValue}
                            service={data}
                            key={index}
                            pathClicked={pathClicked}
                          />
                        )
                    )}
                </div>
                {executed}
                {execution.output && (
                  <div className="action-actionInput">
                    <div className="action-inputLabel">
                      {execution.output.path === output
                        ? `path.${output}: `
                        : 'output:'}
                    </div>
                    <div className="action-inputValue">
                      {execution.output._functionTreePath &&
                      execution.output.path === output ? (
                        <Inspector
                          value={execution.output.payload || {}}
                          pathClicked={pathClicked}
                        />
                      ) : (
                        <Inspector
                          value={execution.output}
                          pathClicked={pathClicked}
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>
              {children}
            </div>
          ) : null}
        </div>
      )
    }

    return (
      <div
        className="action"
        onClick={event => {
          event.stopPropagation()
          actionToggled()
        }}
      >
        <div className="action-titleContainer">
          <div className={titleClassname}>
            {action.isAsync && <i className="icon icon-asyncAction" />}
            {renderActionTitle(action, this.props.showOperatorName)}
          </div>
          {renderDetails(execution, isExpanded)}
        </div>
      </div>
    )
  }
}

export default Action
