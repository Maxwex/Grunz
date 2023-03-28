

var Vector2 = function (x, y) {
    this.x = x;
    this.y = y;
  };

Vector2.prototype.data = function () {
    return [this.x, this.y];
  }
