class ApiFeatures {
  constructor(query, queryStr, type) {
    this.query = query; // Task.find
    this.queryStr = queryStr; // req.query
    this.type = type;
  }

  filter() {
    const query = { ...this.queryStr };

    const removeFields = ["sort", "page", "limit", "sugg", "populate"];

    removeFields.forEach((ele) => {
      delete query[ele];
    });

    let winningPlan = {};

    if (this.queryStr.city && this.queryStr.category) {
      winningPlan = { city: 1, category: 1, score: -1 };
    } else if (this.queryStr.city && !this.queryStr.category) {
      winningPlan = { city: 1, score: -1 };
    }

    let categoryValue;

    if (query.category) {
      categoryValue =
        query.category
          .split(",")
          .map((cat) => cat.toLocaleLowerCase())
          .filter((cat) => (cat.length > 0 ? true : false)) || [];

      query.category = {
        $in: categoryValue.map((val) => new RegExp(val, "i")),
      };
    }

    if (query.city && typeof query.city == "string") {
      let cities =
        query.city.split(",").map((c) => c.toLocaleLowerCase()) || [];

      query.city = { $in: cities };

      console.log(query.city);
    }

    console.log(query);

    this.query = this.query.find(query);

    if (this.type === "product") this.query = this.query.hint(winningPlan);

    return this;
  }

  sort() {
    if (this.queryStr.sort) {
      const sortBy = this.queryStr.sort.replaceAll(",", " ");
      this.query = this.query.sort(sortBy);
    }
    return this;
  }

  paginate() {
    if (this.queryStr.limit && this.queryStr.page) {
      const page = this.queryStr.page * 1 || 1;
      const limit = this.queryStr.limit * 1 || 10;
      const skip = (page - 1) * limit;

      this.query = this.query.skip(skip).limit(limit);
    }
    return this;
  }
  populate() {
    if (this.queryStr.populate) {
      const fields = this.queryStr.populate.replaceAll(",", " ");
      this.query = this.query.populate(fields);
    }
    return this;
  }
}

module.exports = ApiFeatures;
