import { ChangeDetectorRef, Component } from '@angular/core';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ToastController } from '@ionic/angular';
import { db } from '../firebase';

@Component({
  selector: 'app-tab1',
  templateUrl: './tab1.page.html',
  styleUrls: ['./tab1.page.scss'],
  standalone: false,
})
export class Tab1Page {
  // =========================
  // NEW HARDWARE PRODUCT
  // =========================

  newProduct = {
    name: '',
    category: '',
    brand: '',
    price: null as number | null,
    stock: null as number | null,
    condition: 'Brand New',
    description: '',
    sellerName: '',
    contactNumber: '',
  };

  // =========================
  // LOADING STATE
  // =========================

  isLoading = false;

  constructor(
    private toastController: ToastController,
    private changeDetector: ChangeDetectorRef,
  ) {}

  // =========================
  // POST PRODUCT
  // =========================

  async postProduct() {
    if (this.isLoading) {
      return;
    }

    // Validate required fields
    if (
      !this.newProduct.name.trim() ||
      !this.newProduct.category.trim() ||
      !this.newProduct.brand.trim() ||
      this.newProduct.price === null ||
      !Number.isFinite(Number(this.newProduct.price)) ||
      this.newProduct.stock === null ||
      !Number.isInteger(Number(this.newProduct.stock)) ||
      !this.newProduct.condition ||
      !this.newProduct.description.trim() ||
      !this.newProduct.sellerName.trim() ||
      !this.newProduct.contactNumber.trim()
    ) {
      await this.showToast('Please complete all required fields.', 'warning');
      return;
    }

    const price = Number(this.newProduct.price);
    const stock = Number(this.newProduct.stock);

    // Validate price
    if (!Number.isFinite(price) || price <= 0) {
      await this.showToast('Price must be greater than zero.', 'warning');
      return;
    }

    // Validate stock
    if (!Number.isInteger(stock) || stock < 1) {
      await this.showToast(
        'Stock must be a whole number greater than zero.',
        'warning',
      );
      return;
    }

    // Start loading
    this.isLoading = true;
    this.changeDetector.detectChanges();

    try {
      const productsCollection = collection(db, 'hardware_products');

      const productDocument = await addDoc(productsCollection, {
        name: this.newProduct.name.trim(),
        category: this.newProduct.category,
        brand: this.newProduct.brand.trim(),
        price,
        stock,
        condition: this.newProduct.condition,
        description: this.newProduct.description.trim(),
        sellerName: this.newProduct.sellerName.trim(),
        contactNumber: this.newProduct.contactNumber.trim(),

        // Listing information
        status: 'Available',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      console.log('Hardware product posted:', productDocument.id);

      this.resetForm();

      await this.showToast('Hardware product posted successfully!', 'success');
    } catch (error) {
      console.error('Firestore Error:', error);

      await this.showToast(
        'Failed to post product. Please try again.',
        'danger',
      );
    } finally {
      this.isLoading = false;
      this.changeDetector.detectChanges();
    }
  }

  // =========================
  // RESET FORM
  // =========================

  resetForm() {
    this.newProduct = {
      name: '',
      category: '',
      brand: '',
      price: null,
      stock: null,
      condition: 'Brand New',
      description: '',
      sellerName: '',
      contactNumber: '',
    };

    this.changeDetector.detectChanges();
  }

  // =========================
  // TOAST NOTIFICATION
  // =========================

  async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2500,
      position: 'bottom',
      color,
      buttons: [
        {
          text: 'OK',
          role: 'cancel',
        },
      ],
    });

    await toast.present();
  }
}
