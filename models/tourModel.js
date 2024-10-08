const mongoose = require("mongoose");
const slugify = require("slugify");
const validator = require("validator");
const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "a tour must have a name"],
      unique: true,
      trim: true,
      maxlength: [40, "a tour must have less or equal than 40 characters"],
      minlength: [10, "a tour must have less or equal than 40 characters"],
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, "a tour must have a duration"],
    },
    maxGroupSize: {
      type: Number,
      required: [true, "a tour must have a group size"],
    },
    difficulty: {
      type: String,
      required: [true, "A tour must have a difficulty level"],
      enum: {
        values: ["easy", "medium", "difficult"],
        message: "Difficulty should be either: easy, medium, or difficult",
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, "rating must be above 1"],
      max: [5, "rating must be below 5"],
      set:val=>Math.round(val*10)/10
    },
    ratingQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, "a tour must have a price"],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          return val < this.price;
        },
        message: "discount price ({VALUE}) should be below regular price",
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, "a tour must have a description"],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, "a tour must have a cover image"],
    },
    images: [String],

    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },

    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation:{
      type:{
       type:String,
       default:'Point',
       enum:['Point']
      },
      coordinates:[Number],
      address:String,
      description:String
    },
    locations:[
      {
        type:{
          type:String,
          default:'Point',
          enum:['Point']
        },
        coordinated:[Number],
        address:String,
        description:String,
        day:Number
      }
    ],
    guides:[
      {
      type:mongoose.Schema.ObjectId,
      ref:'User',
      },
    ],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

tourSchema.index({price:1,ratingsAverage:-1});
tourSchema.index({slug:1});
tourSchema.index({startLocation:'2dsphere'});

tourSchema.virtual("durationWeeks").get(function () {
  return this.duration / 7;
});

tourSchema.virtual("reviews",{
  ref:'Review',
  foreignField:'tour',
  localField:'_id'
})

tourSchema.pre("save", function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });
  this.start=Date.now()
  next();
});

tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: "guides",
    select: "-__v -passwordChangedAt",
  });
  next();
});

// tourSchema.pre("aggregate", function (next) {
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
//   console.log(this.pipeline());
//   next();
// });

tourSchema.post(/^find/, function (docs, next) {
  console.log(docs);
  next();
});

const Tour = mongoose.model("Tour", tourSchema);

module.exports = Tour;
