class SimplePoly:
    def __init__(self, points):
        self.points = list(points)
        self.points.append(points[0])

    def get_points(self):
        # Strip off the closing point we added
        return self.points[:-1]

    def area(self):
        asum = 0
        for i in range(0,len(self.points)-1):
            asum += self.points[i][0] * self.points[i+1][1]
            asum -= self.points[i+1][0] * self.points[i][1]
        return asum * 0.5

    def centroid(self):
        sum_x = sum_y = factor = 0
        for i in range(0,len(self.points) - 1):
            factor = self.points[i][0]*self.points[i+1][1]
            factor -= self.points[i+1][0]*self.points[i][1]
            sum_x += (self.points[i][0] + self.points[i+1][0])*factor
            sum_y += (self.points[i][1] + self.points[i+1][1])*factor

        area = self.area()
        return (sum_x/(6*area),sum_y/(6*area))

    def bounding_box(self):
        max_x = min_x = max_y = min_y = None

        for (x,y) in self.points:
            if(max_x is None or x > max_x):
                max_x = x
            if(max_y is None or y > max_y):
                max_y = y
            if(min_x is None or x < min_x):
                min_x = x
            if(min_y is None or y < min_y):
                min_y = y

        return ((min_x, min_y), (max_x, max_y))

    def size(self):
        bb = self.bounding_box()
        return (abs(bb[1][0] - bb[0][0]), abs(bb[1][1] - bb[0][1]));

    def scale(self, factor):
        self.points = [(x*factor, y*factor) for (x,y) in self.points]
