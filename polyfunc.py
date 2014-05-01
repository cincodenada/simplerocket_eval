class SimplePoly:
    def __init__(self, points):
        self.points = list(points)
        self.points.append(points[0])

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
