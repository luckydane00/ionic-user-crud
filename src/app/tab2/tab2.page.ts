import { ChangeDetectorRef, Component, OnInit } from '@angular/core';

import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  updateDoc,
} from 'firebase/firestore';

import { ToastController } from '@ionic/angular';
import { db } from '../firebase';

interface HardwareProduct {
  id?: string;
  name: string;
  category: string;
  brand: string;
  price: number;
  stock: number;
  condition: string;
  imageUrl: string;
  description: string;
  sellerName: string;
  contactNumber: string;
  status: string;
  imageError?: boolean;
}

@Component({
  selector: 'app-tab2',
  templateUrl: './tab2.page.html',
  styleUrls: ['./tab2.page.scss'],
  standalone: false,
})
export class Tab2Page implements OnInit {
  products: HardwareProduct[] = [];
  filteredProducts: HardwareProduct[] = [];

  searchTerm = '';
  selectedCategory = 'ALL';

  isLoading = false;
  isSaving = false;
  isEditModalOpen = false;

  editingProduct: HardwareProduct = this.createEmptyProduct();

  swipedProductId: string | undefined;
  private swipeStartX = 0;
  private swipeCurrentX = 0;
  private isSwiping = false;
  private didSwipe = false;

  constructor(
    private toastController: ToastController,
    private changeDetector: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  // =========================
  // EMPTY PRODUCT
  // =========================

  private createEmptyProduct(): HardwareProduct {
    return {
      name: '',
      category: '',
      brand: '',
      price: 0,
      stock: 0,
      condition: 'Brand New',
      imageUrl: '',
      description: '',
      sellerName: '',
      contactNumber: '',
      status: 'Available',
    };
  }

  // =========================
  // SUMMARY COUNTS
  // =========================

  get availableCount(): number {
    return this.products.filter((product) => product.stock > 0).length;
  }

  get outOfStockCount(): number {
    return this.products.filter((product) => product.stock <= 0).length;
  }

  trackByProductId(index: number, product: HardwareProduct): string | number {
    return product.id || index;
  }

  // =========================
  // LOAD PRODUCTS
  // =========================

  async loadProducts(): Promise<void> {
    if (this.isLoading) {
      return;
    }

    this.isLoading = true;
    this.changeDetector.detectChanges();

    try {
      const productsCollection = collection(db, 'hardware_products');

      const snapshot = await getDocs(productsCollection);

      this.products = snapshot.docs.map((document) => {
        const data = document.data();

        const stock = Number(data['stock']);
        const price = Number(data['price']);

        return {
          id: document.id,
          name: data['name'] || '',
          category: data['category'] || 'Other',
          brand: data['brand'] || '',
          price: Number.isFinite(price) ? price : 0,
          stock: Number.isFinite(stock) ? stock : 0,
          condition: data['condition'] || 'Brand New',
          imageUrl: data['imageUrl'] || '',
          description: data['description'] || '',
          sellerName: data['sellerName'] || '',
          contactNumber: data['contactNumber'] || '',
          status: data['status'] || 'Available',
          imageError: false,
        };
      });

      // Newest first, when timestamps are available.
      this.products.sort((a, b) => {
        const getTime = (id?: string) => {
          const data = snapshot.docs.find((d) => d.id === id)?.data();
          const timestamp = data?.['createdAt'];

          return timestamp?.toMillis?.() ?? 0;
        };

        return getTime(b.id) - getTime(a.id);
      });

      this.applyFilters();
    } catch (error) {
      console.error('Error loading products:', error);
      await this.showToast('Failed to load hardware products.', 'danger');
    } finally {
      this.isLoading = false;
      this.changeDetector.detectChanges();
    }
  }

  // =========================
  // PULL TO REFRESH
  // =========================

  async refreshProducts(event: any): Promise<void> {
    try {
      const snapshot = await getDocs(collection(db, 'hardware_products'));

      this.products = snapshot.docs.map((document) => {
        const data = document.data();

        const price = Number(data['price']);
        const stock = Number(data['stock']);

        return {
          id: document.id,
          name: data['name'] || '',
          category: data['category'] || 'Other',
          brand: data['brand'] || '',
          price: Number.isFinite(price) ? price : 0,
          stock: Number.isFinite(stock) ? stock : 0,
          condition: data['condition'] || 'Brand New',
          imageUrl: data['imageUrl'] || '',
          description: data['description'] || '',
          sellerName: data['sellerName'] || '',
          contactNumber: data['contactNumber'] || '',
          status: data['status'] || 'Available',
          imageError: false,
        };
      });

      this.applyFilters();
    } catch (error) {
      console.error('Refresh error:', error);
      await this.showToast('Failed to refresh products.', 'danger');
    } finally {
      event.target.complete();
      this.changeDetector.detectChanges();
    }
  }

  // =========================
  // SEARCH AND FILTER
  // =========================

  applyFilters(): void {
    let result = [...this.products];

    if (this.selectedCategory !== 'ALL') {
      result = result.filter(
        (product) => product.category === this.selectedCategory,
      );
    }

    const search = this.searchTerm.trim().toLowerCase();

    if (search) {
      result = result.filter(
        (product) =>
          product.name.toLowerCase().includes(search) ||
          product.brand.toLowerCase().includes(search) ||
          product.category.toLowerCase().includes(search) ||
          product.condition.toLowerCase().includes(search) ||
          product.description.toLowerCase().includes(search) ||
          product.sellerName.toLowerCase().includes(search),
      );
    }

    this.filteredProducts = result;
    this.changeDetector.detectChanges();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedCategory = 'ALL';
    this.closeSwipe();
    this.applyFilters();
  }

  // =========================
  // SWIPE ACTIONS
  // =========================

  startSwipe(event: PointerEvent, product: HardwareProduct): void {
    if (event.pointerType === 'mouse' && event.button !== 0) {
      return;
    }

    this.swipeStartX = event.clientX;
    this.swipeCurrentX = event.clientX;
    this.isSwiping = true;
    this.didSwipe = false;

    if (this.swipedProductId && this.swipedProductId !== product.id) {
      this.swipedProductId = undefined;
    }
  }

  moveSwipe(event: PointerEvent, product: HardwareProduct): void {
    if (!this.isSwiping) {
      return;
    }

    this.swipeCurrentX = event.clientX;

    const difference = this.swipeStartX - this.swipeCurrentX;

    if (Math.abs(difference) > 10) {
      this.didSwipe = true;
    }

    if (difference > 55) {
      this.swipedProductId = product.id;
    } else if (difference < -55) {
      this.swipedProductId = undefined;
    }
  }

  endSwipe(event: PointerEvent, product: HardwareProduct): void {
    if (!this.isSwiping) {
      return;
    }

    this.swipeCurrentX = event.clientX;

    const difference = this.swipeStartX - this.swipeCurrentX;

    if (difference > 70) {
      this.swipedProductId = product.id;
    } else if (difference < -50) {
      this.swipedProductId = undefined;
    }

    this.isSwiping = false;
    this.changeDetector.detectChanges();
  }

  handleCardClick(product: HardwareProduct): void {
    if (this.didSwipe) {
      this.didSwipe = false;
      return;
    }

    if (this.swipedProductId === product.id) {
      this.closeSwipe();
    }
  }

  closeSwipe(): void {
    this.swipedProductId = undefined;
    this.isSwiping = false;
    this.didSwipe = false;
    this.changeDetector.detectChanges();
  }

  // =========================
  // EDIT PRODUCT
  // =========================

  openEditModal(product: HardwareProduct): void {
    this.editingProduct = {
      ...product,
      imageError: false,
    };

    this.isEditModalOpen = true;
    this.closeSwipe();
    this.changeDetector.detectChanges();
  }

  closeEditModal(): void {
    if (this.isSaving) {
      return;
    }

    this.isEditModalOpen = false;
    this.changeDetector.detectChanges();
  }

  async saveProduct(): Promise<void> {
    if (this.isSaving) {
      return;
    }

    const product = this.editingProduct;

    if (!product.id) {
      await this.showToast('Product ID is missing.', 'danger');
      return;
    }

    if (
      !product.name.trim() ||
      !product.category.trim() ||
      !product.brand.trim() ||
      !product.condition ||
      !product.description.trim() ||
      !product.sellerName.trim() ||
      !product.contactNumber.trim()
    ) {
      await this.showToast('Please complete all required fields.', 'warning');
      return;
    }

    const price = Number(product.price);
    const stock = Number(product.stock);

    if (!Number.isFinite(price) || price <= 0) {
      await this.showToast('Price must be greater than zero.', 'warning');
      return;
    }

    if (!Number.isInteger(stock) || stock < 0) {
      await this.showToast(
        'Stock must be a whole number and cannot be negative.',
        'warning',
      );
      return;
    }

    const imageUrl = product.imageUrl.trim();

    if (imageUrl) {
      try {
        const parsedUrl = new URL(imageUrl);

        if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
          throw new Error('Invalid image URL');
        }
      } catch {
        await this.showToast('Please enter a valid image URL.', 'warning');
        return;
      }
    }

    this.isSaving = true;
    this.changeDetector.detectChanges();

    try {
      await updateDoc(doc(db, 'hardware_products', product.id), {
        name: product.name.trim(),
        category: product.category,
        brand: product.brand.trim(),
        price,
        stock,
        condition: product.condition,
        imageUrl: imageUrl || null,
        description: product.description.trim(),
        sellerName: product.sellerName.trim(),
        contactNumber: product.contactNumber.trim(),
        status: stock > 0 ? 'Available' : 'Out of Stock',
        updatedAt: new Date(),
      });

      this.isEditModalOpen = false;

      await this.loadProducts();

      await this.showToast('Product updated successfully!', 'success');
    } catch (error) {
      console.error('Update error:', error);
      await this.showToast('Failed to update product.', 'danger');
    } finally {
      this.isSaving = false;
      this.changeDetector.detectChanges();
    }
  }

  // =========================
  // DELETE PRODUCT
  // =========================

  async deleteProduct(product: HardwareProduct): Promise<void> {
    if (!product.id || this.isLoading || this.isSaving) {
      if (!product.id) {
        await this.showToast('Product ID is missing.', 'danger');
      }
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete "${product.name}"?`,
    );

    if (!confirmed) {
      return;
    }

    this.isSaving = true;
    this.changeDetector.detectChanges();

    try {
      await deleteDoc(doc(db, 'hardware_products', product.id));

      this.products = this.products.filter((item) => item.id !== product.id);

      this.closeSwipe();
      this.applyFilters();

      await this.showToast('Product deleted successfully!', 'success');
    } catch (error) {
      console.error('Delete error:', error);
      await this.showToast('Failed to delete product.', 'danger');
    } finally {
      this.isSaving = false;
      this.changeDetector.detectChanges();
    }
  }

  // =========================
  // TOAST
  // =========================

  async showToast(message: string, color: string): Promise<void> {
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
