from rest_framework import serializers
from .models import Book, IssueReturn

class BookSerializer(serializers.ModelSerializer):
    class Meta:
        model = Book
        fields = '__all__'
        read_only_fields = ['school']

class IssueReturnSerializer(serializers.ModelSerializer):
    book_title = serializers.ReadOnlyField(source='book.title')
    student_name = serializers.ReadOnlyField(source='student.name')
    
    class Meta:
        model = IssueReturn
        fields = '__all__'
        read_only_fields = ['school']
