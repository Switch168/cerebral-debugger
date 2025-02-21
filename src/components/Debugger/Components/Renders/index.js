import './styles.css'

function getTime(date) {
  const hours =
    String(date.getHours()).length === 2
      ? date.getHours()
      : '0' + date.getHours()
  const minutes =
    String(date.getMinutes()).length === 2
      ? date.getMinutes()
      : '0' + date.getMinutes()
  const seconds =
    String(date.getSeconds()).length === 2
      ? date.getSeconds()
      : '0' + date.getSeconds()
  return hours + ':' + minutes + ':' + seconds
}

function extractPaths(changes) {
  if (!changes) {
    return []
  }

  return changes.reduce((paths, change) => {
    return paths.concat(change.path.join('.'))
  }, [])
}

function unique(array) {
  return array.reduce((newArray, item) => {
    if (newArray.indexOf(item) === -1) {
      return newArray.concat(item)
    }

    return newArray
  }, [])
}

function filterRenderByPath(pathFilter, render) {
  if (pathFilter) {
    return extractPaths(render.changes).reduce(
      (hasPath, path) => hasPath || path.indexOf(pathFilter) >= 0,
      false
    )
  } else {
    return true
  }
}

function filterRenderByComponentName(componentNameFilter, render) {
  if (componentNameFilter) {
    return render.components.reduce(
      (hasPath, component) =>
        hasPath ||
        component.toLowerCase().indexOf(componentNameFilter.toLowerCase()) >= 0,
      false
    )
  } else {
    return true
  }
}

export default function Renders(props) {
  return (
    <div className="renders-wrapper">
      <div className="renders-renderWrapper">
        {props.renders
          .filter(
            render =>
              filterRenderByPath(props.pathFilter, render) &&
              filterRenderByComponentName(props.componentNameFilter, render)
          )
          .map((render, index) => {
            const date = new Date(render.start)

            return (
              <div className="renders-item" key={index}>
                <div className="renders-itemHeader">
                  <strong>{getTime(date)}</strong> - {render.duration}ms
                </div>
                <div className="renders-renderDataWrapper">
                  <div className="renders-paths">
                    <div className="renders-pathsHeader">
                      <small>Paths changed</small>
                    </div>
                    <div className="renders-pathsList">
                      {extractPaths(render.changes).map((path, index) => {
                        return (
                          <div className="renders-path" key={index}>
                            <strong>{path}</strong>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                  <div className="renders-components">
                    <div className="renders-componentsHeader">
                      <small>Components rendered</small>
                    </div>
                    <div className="renders-componentsList">
                      {unique(render.components).join(', ')}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
      </div>
    </div>
  )
}
