from django.db import models
from schools.models import School
from students.models import Student

class Book(models.Model):
    school = models.ForeignKey(School, on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    author = models.CharField(max_length=200)
    isbn = models.CharField(max_length=20, blank=True, null=True)
    quantity = models.IntegerField(default=1)
    available_quantity = models.IntegerField(default=1)
    category = models.CharField(max_length=100, blank=True, null=True)

    def __str__(self):
        return self.title

class IssueReturn(models.Model):
    school = models.ForeignKey(School, on_delete=models.CASCADE)
    book = models.ForeignKey(Book, on_delete=models.CASCADE)
    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    issue_date = models.DateField(auto_now_add=True)
    due_date = models.DateField()
    return_date = models.DateField(null=True, blank=True)
    fine_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    status = models.CharField(max_length=20, choices=(('Issued', 'Issued'), ('Returned', 'Returned')), default='Issued')

    def __str__(self):
        return f"{self.book.title} issued to {self.student.name}"
