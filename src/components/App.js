import React, { Component } from "react";
import { BrowserRouter, Route } from "react-router-dom";

import Annotator from "./Annotator";

class App extends Component {
  render() {
    return (
      <div>
        <BrowserRouter>
          <div>
            <Route
              exact
              path="/"
              render={() => (
                <Annotator displayKeypoints={this.displayKeypoints} />
              )}
            />
          </div>
        </BrowserRouter>
      </div>
    );
  }
}

export default App;